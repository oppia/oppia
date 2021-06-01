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

from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import taskqueue_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(
    job_models, exp_models, base_models, classifier_models, improvements_models,
) = models.Registry.import_models([
    models.NAMES.job, models.NAMES.exploration, models.NAMES.base_model,
    models.NAMES.classifier, models.NAMES.improvements
])

datastore_services = models.Registry.import_datastore_services()
search_services = models.Registry.import_search_services()


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


class MockExplorationModelWithDeprecatedFields(exp_models.ExplorationModel):
    """Mock ExplorationModel to be able to set skill_tags, default_skin,
    and skin_customizations.
    """

    skill_tags = (
        datastore_services.StringProperty(indexed=True, repeated=True))
    default_skin = (
        datastore_services.StringProperty(default='conversation_v1'))
    skin_customizations = datastore_services.JsonProperty(indexed=False)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Override this to escape recursion, which will otherwise occur
        when super() is used in a mocked class.
        """

        base_models.VersionedModel._trusted_commit( # pylint: disable=protected-access
            self, committer_id, commit_type, commit_message, commit_cmds)


class RemoveDeprecatedExplorationModelFieldsOneOffJobTests(
        test_utils.GenericTestBase):

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            exp_jobs_one_off.RemoveDeprecatedExplorationModelFieldsOneOffJob
            .create_new()
        )
        (
            exp_jobs_one_off.RemoveDeprecatedExplorationModelFieldsOneOffJob
            .enqueue(job_id))
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            exp_jobs_one_off.RemoveDeprecatedExplorationModelFieldsOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    # This test for three deprecated fields is merged into one test because
    # running three different tests resulted in failures. The failures were
    # caused because the map() function of
    # RemoveDeprecatedExplorationModelFieldsOneOffJob was called one time
    # each by the test but the field was removed in only one test and rest
    # two tests were failing.
    def test_one_exp_models_with_deprecated_field(self):
        with self.swap(
            exp_models,
            'ExplorationModel',
            MockExplorationModelWithDeprecatedFields
        ):
            exp_model1 = exp_models.ExplorationModel(
                id='exp_id1',
                category='category',
                title='title',
                objective='objective',
                language_code='en',
                tags=[],
                blurb='',
                author_notes='',
                init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
                param_specs={},
                param_changes=[],
                skill_tags=['tag1', 'tag2'],
                default_skin='conversation_v1',
                skin_customizations={},
            )
            rights_manager.create_new_exploration_rights('exp_id1', 'uid_1')
            commit_message = 'New exploration created with title \'title\'.'
            exp_model1.commit('uid_1', commit_message, [{
                'cmd': 'create_new',
                'title': 'title',
                'category': 'category',
            }])

            self.assertIsNotNone(exp_model1.skill_tags)
            self.assertIsNotNone(exp_model1.default_skin)
            self.assertIsNotNone(exp_model1.skin_customizations)

            self.assertIn('skill_tags', exp_model1._values) # pylint: disable=protected-access
            self.assertIn('skill_tags', exp_model1._properties) # pylint: disable=protected-access

            self.assertIn('default_skin', exp_model1._values) # pylint: disable=protected-access
            self.assertIn('default_skin', exp_model1._properties) # pylint: disable=protected-access

            self.assertIn('skin_customizations', exp_model1._values) # pylint: disable=protected-access
            self.assertIn('skin_customizations', exp_model1._properties) # pylint: disable=protected-access

            output = self._run_one_off_job()
            self.assertItemsEqual(
                [['SUCCESS_REMOVED - ExplorationModel', 1]], output)

            migrated_exp_model1 = (
                exp_models.ExplorationModel.get_by_id('exp_id1'))

            self.assertNotIn(
                'skill_tags', migrated_exp_model1._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'skill_tags', migrated_exp_model1._properties)  # pylint: disable=protected-access

            self.assertNotIn(
                'default_skin', migrated_exp_model1._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'default_skin', migrated_exp_model1._properties)  # pylint: disable=protected-access

            self.assertNotIn(
                'skin_customizations', migrated_exp_model1._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'skin_customizations', migrated_exp_model1._properties)  # pylint: disable=protected-access

            # Run job twice.
            output = self._run_one_off_job()
            self.assertItemsEqual(
                [['SUCCESS_ALREADY_REMOVED - ExplorationModel', 1]], output)

    def test_one_exploration_model_without_deprecated_fields(self):
        original_exploration_model = exp_models.ExplorationModel(
            id='exp_id4',
            category='category',
            title='title',
            objective='Old objective',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            param_specs={},
            param_changes=[]
        )
        rights_manager.create_new_exploration_rights('exp_id4', 'uid_4')
        commit_message = 'New exploration created with title \'title\'.'
        original_exploration_model.commit('uid_4', commit_message, [{
            'cmd': 'create_new',
            'title': 'title',
            'category': 'category',
        }])
        original_exploration_model = (
            exp_models.ExplorationModel.get_by_id('exp_id4'))
        self.assertNotIn(
            'skill_tags', original_exploration_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'skill_tags', original_exploration_model._properties)  # pylint: disable=protected-access

        # Fields were never there to begin with, so already removed.
        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ALREADY_REMOVED - ExplorationModel', 1]], output)

        migrated_exploration_model = (
            exp_models.ExplorationModel.get_by_id('exp_id4'))
        self.assertNotIn(
            'skill_tags', migrated_exploration_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'skill_tags', migrated_exploration_model._properties)  # pylint: disable=protected-access


class MockExplorationRightsModelWithDeprecatedFields(
        exp_models.ExplorationRightsModel):
    """Mock ExplorationRightsModel to be able to set translator_ids,
    all_viewer_ids
    """

    translator_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))

    all_viewer_ids = datastore_services.StringProperty(
        indexed=True, repeated=True)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Override this to escape recursion, which will otherwise occur
        when super() is used in a mocked class.
        """

        base_models.VersionedModel._trusted_commit( # pylint: disable=protected-access
            self, committer_id, commit_type, commit_message, commit_cmds)


class RemoveDeprecatedExplorationRightsModelFieldsOneOffJobTests(
        test_utils.GenericTestBase):

    EXP_ID_1 = '1'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_COMMITTER = 'id_committer'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            exp_jobs_one_off.
            RemoveDeprecatedExplorationRightsModelFieldsOneOffJob
            .create_new()
        )
        (
            exp_jobs_one_off.
            RemoveDeprecatedExplorationRightsModelFieldsOneOffJob
            .enqueue(job_id))
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            exp_jobs_one_off.
            RemoveDeprecatedExplorationRightsModelFieldsOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    # This test for two deprecated fields is merged into one test because
    # running two different tests resulted in failures. The failures were
    # caused because the map() function of
    # RemoveDeprecatedExplorationRightsModelFieldsOneOffJob was called one time
    # each by the test but the field was removed in only one test and rest
    # one test was failing.
    def test_one_exp_rights_models_with_deprecated_field(self):
        with self.swap(
            exp_models,
            'ExplorationRightsModel',
            MockExplorationRightsModelWithDeprecatedFields
        ):
            exp_models.ExplorationRightsModel(
                id=self.EXP_ID_1,
                owner_ids=[self.USER_ID_1],
                editor_ids=[self.USER_ID_1],
                voice_artist_ids=[self.USER_ID_1],
                viewer_ids=[self.USER_ID_2],
                community_owned=False,
                status='public',
                viewable_if_private=False,
                first_published_msec=0.1,
                translator_ids=[self.USER_ID_1],
                all_viewer_ids=[],
            ).save(
                self.USER_ID_COMMITTER, 'Created new exploration right',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])

            exp_rights_model = exp_models.ExplorationRightsModel.get_by_id(
                self.EXP_ID_1)

            self.assertIsNotNone(exp_rights_model.translator_ids)
            self.assertIsNotNone(exp_rights_model.all_viewer_ids)

            self.assertIn('translator_ids', exp_rights_model._values) # pylint: disable=protected-access
            self.assertIn('translator_ids', exp_rights_model._properties) # pylint: disable=protected-access

            self.assertIn('all_viewer_ids', exp_rights_model._values) # pylint: disable=protected-access
            self.assertIn('all_viewer_ids', exp_rights_model._properties) # pylint: disable=protected-access

            output = self._run_one_off_job()
            self.assertItemsEqual(
                [['SUCCESS_REMOVED - ExplorationRightsModel', 1]], output)

            migrated_exp_rights_model = (
                exp_models.ExplorationRightsModel.get_by_id(self.EXP_ID_1))

            self.assertNotIn(
                'translator_ids', migrated_exp_rights_model._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'translator_ids', migrated_exp_rights_model._properties)  # pylint: disable=protected-access

            self.assertNotIn(
                'all_viewer_ids', migrated_exp_rights_model._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'all_viewer_ids', migrated_exp_rights_model._properties)  # pylint: disable=protected-access

            # Run job twice.
            output = self._run_one_off_job()
            self.assertItemsEqual(
                [['SUCCESS_ALREADY_REMOVED - ExplorationRightsModel', 1]],
                output)

    def test_one_exp_rights_model_without_deprecated_fields(self):
        exp_models.ExplorationRightsModel(
            id=self.EXP_ID_1,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_2],
            community_owned=False,
            status='public',
            viewable_if_private=False,
            first_published_msec=0.1,
        ).save(
            self.USER_ID_COMMITTER, 'Created new exploration right',
            [{'cmd': rights_domain.CMD_CREATE_NEW}])

        exp_rights_model = exp_models.ExplorationRightsModel.get_by_id(
            self.EXP_ID_1)

        self.assertNotIn(
            'translator_ids', exp_rights_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'translator_ids', exp_rights_model._properties)  # pylint: disable=protected-access

        self.assertNotIn(
            'all_viewer_ids', exp_rights_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'all_viewer_ids', exp_rights_model._properties)  # pylint: disable=protected-access

        # Fields were never there to begin with, so already removed.
        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ALREADY_REMOVED - ExplorationRightsModel', 1]], output)

        migrated_exploration_model = (
            exp_models.ExplorationRightsModel.get_by_id(self.EXP_ID_1))

        self.assertNotIn(
            'translator_ids', migrated_exploration_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'translator_ids', migrated_exploration_model._properties)  # pylint: disable=protected-access

        self.assertNotIn(
            'all_viewer_ids', migrated_exploration_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'all_viewer_ids', migrated_exploration_model._properties)  # pylint: disable=protected-access


class OneOffExplorationFirstPublishedJobTests(test_utils.GenericTestBase):

    EXP_ID = 'exp_id'

    def setUp(self):
        super(OneOffExplorationFirstPublishedJobTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

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
        self.process_and_flush_pending_mapreduce_tasks()
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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationValidityJobManager.get_output(
                job_id))
        self.assertEqual(actual_output, [])

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.get_user_actions_info(self.albert_id)

        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ExplorationValidityJobManager job on published exploration.
        job_id = exp_jobs_one_off.ExplorationValidityJobManager.create_new()
        exp_jobs_one_off.ExplorationValidityJobManager.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationValidityJobManager.get_output(
                job_id))
        self.assertEqual(actual_output, [])

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.get_user_actions_info(self.albert_id)

        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ExplorationValidityJobManager job on published exploration.
        job_id = exp_jobs_one_off.ExplorationValidityJobManager.create_new()
        exp_jobs_one_off.ExplorationValidityJobManager.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        owner = user_services.get_user_actions_info(self.albert_id)

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE)
            exp_services.save_new_exploration(self.albert_id, exploration)

        # Note: This creates a summary based on the upgraded model (which is
        # fine). A summary is needed to delete the exploration.
        exp_services.regenerate_exploration_and_contributors_summaries(
            self.NEW_EXP_ID)

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
        self.process_and_flush_pending_mapreduce_tasks()

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

    def test_audit_job_runs_for_any_state_schema_version(self):
        """Tests that the exploration migration converts older explorations to a
        previous state schema version before running the audit job.
        """
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE)
            exp_services.save_new_exploration(self.albert_id, exploration)

        job_id = exp_jobs_one_off.ExplorationMigrationAuditJob.create_new()
        exp_jobs_one_off.ExplorationMigrationAuditJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()
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
            41,
            self.NEW_EXP_ID,
            self.albert_id,
            {'Introduction': states_dict}
        )

        swap_states_schema_version = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_version = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 47)
        with swap_states_schema_version, swap_exp_schema_version:
            job_id = exp_jobs_one_off.ExplorationMigrationAuditJob.create_new()
            exp_jobs_one_off.ExplorationMigrationAuditJob.enqueue(job_id)
            self.process_and_flush_pending_mapreduce_tasks()

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
            41,
            self.NEW_EXP_ID,
            self.albert_id,
            {'Introduction': states_dict}
        )

        # Make a mock conversion function that raises an error.
        mock_conversion = classmethod(
            lambda cls, exploration_dict: exploration_dict['property_that_dne'])

        swap_states_schema_version = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_version = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 47)

        with swap_states_schema_version, swap_exp_schema_version, self.swap(
            exp_domain.Exploration,
            '_convert_states_v41_dict_to_v42_dict',
            mock_conversion
        ):
            job_id = exp_jobs_one_off.ExplorationMigrationAuditJob.create_new()
            exp_jobs_one_off.ExplorationMigrationAuditJob.enqueue(job_id)
            self.process_and_flush_pending_mapreduce_tasks()

            actual_output = (
                exp_jobs_one_off.ExplorationMigrationAuditJob.get_output(
                    job_id)
            )

        expected_output = [
            u'[u\'MIGRATION_ERROR\', [u"Exploration exp_id1 failed '
            'migration to states v42: u\'property_that_dne\'"]]'
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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE)
            exp_services.save_new_exploration(self.albert_id, exploration)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE)
            exp_services.save_new_exploration(self.albert_id, exploration)

        # Note: This creates a summary based on the upgraded model (which is
        # fine). A summary is needed to delete the exploration.
        exp_services.regenerate_exploration_and_contributors_summaries(
            self.NEW_EXP_ID)

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
        self.process_and_flush_pending_mapreduce_tasks()

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

    def test_exploration_migration_job_output(self):
        """Test that Exploration Migration job output is correct."""
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE)
            exp_services.save_new_exploration(self.albert_id, exploration)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationMigrationJobManager.get_output(job_id))
        expected_output = ['[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

    def test_migration_job_creates_appropriate_classifier_models(self):
        """Tests that the exploration migration job creates appropriate
        classifier data models for explorations.
        """
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exp_model = exp_models.ExplorationModel(
                id=self.NEW_EXP_ID, category='category', title=self.EXP_TITLE,
                objective='Old objective', language_code='en', tags=[],
                blurb='', author_notes='', states_schema_version=41,
                init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
                states={
                    'END': {
                        'classifier_model_id': None,
                        'content': {
                            'content_id': 'content',
                            'html': 'Congratulations, you have finished!',
                        },
                        'interaction': {
                            'answer_groups': [],
                            'confirmed_unclassified_answers': [],
                            'customization_args': {
                                'recommendedExplorationIds': {'value': []},
                            },
                            'default_outcome': None,
                            'hints': [],
                            'id': 'EndExploration',
                            'solution': None,
                        },
                        'next_content_id_index': 0,
                        'param_changes': [],
                        'recorded_voiceovers': {
                            'voiceovers_mapping': {
                                'content': {},
                            }
                        },
                        'solicit_answer_details': False,
                        'written_translations': {
                            'translations_mapping': {
                                'content': {},
                            }
                        }
                    },
                    'Introduction': {
                        'classifier_model_id': None,
                        'content': {'content_id': 'content', 'html': ''},
                        'interaction': {
                            'answer_groups': [{
                                'outcome': {
                                    'dest': 'END',
                                    'feedback': {
                                        'content_id': 'feedback_1',
                                        'html': '<p>Correct!</p>',
                                    },
                                    'labelled_as_correct': False,
                                    'missing_prerequisite_skill_id': None,
                                    'param_changes': [],
                                    'refresher_exploration_id': None,
                                },
                                'rule_specs': [{
                                    'inputs': {
                                        'x': {
                                            'contentId': 'rule_input_3',
                                            'normalizedStrSet': ['InputString']
                                        }
                                    },
                                    'rule_type': 'Equals',
                                }],
                                'tagged_skill_misconception_id': None,
                                'training_data': [
                                    'answer1', 'answer2', 'answer3'
                                ],
                            }],
                            'confirmed_unclassified_answers': [],
                            'customization_args': {
                                'placeholder': {
                                    'value': {
                                        'content_id': 'ca_placeholder_2',
                                        'unicode_str': '',
                                    },
                                },
                                'rows': {'value': 1},
                            },
                            'default_outcome': {
                                'dest': 'Introduction',
                                'feedback': {
                                    'content_id': 'default_outcome',
                                    'html': ''
                                },
                                'labelled_as_correct': False,
                                'missing_prerequisite_skill_id': None,
                                'param_changes': [],
                                'refresher_exploration_id': None,
                            },
                            'hints': [],
                            'id': 'TextInput',
                            'solution': None,
                        },
                        'next_content_id_index': 4,
                        'param_changes': [],
                        'recorded_voiceovers': {
                            'voiceovers_mapping': {
                                'ca_placeholder_2': {},
                                'content': {},
                                'default_outcome': {},
                                'feedback_1': {},
                                'rule_input_3': {},
                            }
                        },
                        'solicit_answer_details': False,
                        'written_translations': {
                            'translations_mapping': {
                                'ca_placeholder_2': {},
                                'content': {},
                                'default_outcome': {},
                                'feedback_1': {},
                                'rule_input_3': {},
                            }
                        },
                    },
                }, param_specs={}, param_changes=[])
            rights_manager.create_new_exploration_rights(
                self.NEW_EXP_ID, self.albert_id)

        commit_message = (
            'New exploration created with title \'%s\'.' % self.EXP_TITLE)
        exp_model.commit(self.albert_id, commit_message, [{
            'cmd': 'create_new',
            'title': 'title',
            'category': 'category',
        }])
        exp_rights = exp_models.ExplorationRightsModel.get_by_id(
            self.NEW_EXP_ID)
        exp_summary_model = exp_models.ExpSummaryModel(
            id=self.NEW_EXP_ID, title=self.EXP_TITLE, category='category',
            objective='Old objective', language_code='en', tags=[],
            ratings=feconf.get_empty_ratings(),
            scaled_average_rating=feconf.EMPTY_SCALED_AVERAGE_RATING,
            status=exp_rights.status,
            community_owned=exp_rights.community_owned,
            owner_ids=exp_rights.owner_ids, contributor_ids=[],
            contributors_summary={})
        exp_summary_model.update_timestamps()
        exp_summary_model.put()

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        initial_state_name = list(exploration.states.keys())[0]
        # Store classifier model for the new exploration.
        classifier_model_id = (
            classifier_models.ClassifierTrainingJobModel.create(
                'TextClassifier', 'TextInput', self.NEW_EXP_ID,
                exploration.version, datetime.datetime.utcnow(), {},
                initial_state_name, feconf.TRAINING_JOB_STATUS_COMPLETE, 1))
        # Store training job model for the classifier model.
        classifier_models.StateTrainingJobsMappingModel.create(
            self.NEW_EXP_ID, exploration.version, initial_state_name,
            {'TextClassifier': classifier_model_id})

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            with self.swap(feconf, 'MIN_TOTAL_TRAINING_EXAMPLES', 2):
                with self.swap(feconf, 'MIN_ASSIGNED_LABELS', 1):
                    self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationMigrationJobManager.get_output(job_id))
        expected_output = ['[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

        new_exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        initial_state_name = list(new_exploration.states.keys())[0]
        self.assertLess(exploration.version, new_exploration.version)
        classifier_exp_mapping_model = (
            classifier_models.StateTrainingJobsMappingModel.get_models(
                self.NEW_EXP_ID, new_exploration.version,
                [initial_state_name]))[0]
        self.assertEqual(
            classifier_exp_mapping_model.algorithm_ids_to_job_ids[
                'TextClassifier'], classifier_model_id)

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
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])

        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        with self.swap(logging, 'error', _mock_logging_function):
            self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ViewableExplorationsAuditJob.get_output(
                job_id))
        self.assertEqual(actual_output, [])

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.get_user_actions_info(self.albert_id)

        rights_manager.set_private_viewability_of_exploration(
            owner, self.VALID_EXP_ID, True)

        # Start ViewableExplorationsAudit job on sample exploration.
        job_id = exp_jobs_one_off.ViewableExplorationsAuditJob.create_new()
        exp_jobs_one_off.ViewableExplorationsAuditJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ViewableExplorationsAuditJob.get_output(
                job_id))
        expected_output = ['[u\'exp_id0\', [u\'title\']]']
        self.assertEqual(actual_output, expected_output)

        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ViewableExplorationsAudit job on sample exploration.
        job_id = exp_jobs_one_off.ViewableExplorationsAuditJob.create_new()
        exp_jobs_one_off.ViewableExplorationsAuditJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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
        owner = user_services.get_user_actions_info(self.albert_id)

        rights_manager.set_private_viewability_of_exploration(
            owner, self.VALID_EXP_ID, True)

        exp_rights_model = exp_models.ExplorationRightsModel.get(
            self.VALID_EXP_ID)
        exp_rights_model.delete(feconf.SYSTEM_COMMITTER_ID, 'Delete model')

        # Start ViewableExplorationsAudit job on sample exploration.
        job_id = exp_jobs_one_off.ViewableExplorationsAuditJob.create_new()
        exp_jobs_one_off.ViewableExplorationsAuditJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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
        owner = user_services.get_user_actions_info(self.albert_id)

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.process_and_flush_pending_mapreduce_tasks()

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
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])

        job_id = (
            exp_jobs_one_off
            .ExplorationContentValidationJobForCKEditor.create_new())
        exp_jobs_one_off.ExplorationContentValidationJobForCKEditor.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationContentValidationJobForCKEditor.get_output(job_id))
        expected_output = [
            u'[u\'Error Sorry, we can only process v41-v%s exploration state '
            'schemas at present. when loading exploration\', '
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
        self.process_and_flush_pending_mapreduce_tasks()

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

        state_answer_group_list = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'Introduction', state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': [['ca_choices_0']]
                    })
            ],
            [],
            None
        )]

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
        state2.update_interaction_answer_groups(state_answer_group_list)
        state2.update_written_translations(
            state_domain.WrittenTranslations.from_dict(
                written_translations_dict))

        exp_services.save_new_exploration(self.albert_id, exploration)

        job_id = (
            exp_jobs_one_off
            .ExplorationMathSvgFilenameValidationOneOffJob.create_new())
        exp_jobs_one_off.ExplorationMathSvgFilenameValidationOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.assertEqual(overall_result[1]['no_of_invalid_tags'], 6)
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
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationMathSvgFilenameValidationOneOffJob.get_output(job_id))
        self.assertEqual(len(actual_output), 0)


class ExplorationRteMathContentValidationOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            ExplorationRteMathContentValidationOneOffJobTests,
            self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

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
            ';mathImg_20201216*331234_r3ir43lmfd_height_2d456_width_6d1'
            '24_vertical_0d231.svg&amp;quot;}"></oppia-noninteractive-math>')

        invalid_html_content2 = (
            '<p>Feedback2</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;-,-,-,-'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';mathImg_20200216_133832_imzlvnf23a_invalid_4d123_width_23d'
            '122_vertical_2d123.svg&amp;quot;}"></oppia-noninteractive-math>')

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

        state_answer_group_list = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'Introduction', state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': [['ca_choices_0']]
                    })
            ],
            [],
            None
        )]
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
        state2.update_interaction_answer_groups(state_answer_group_list)
        state2.update_written_translations(
            state_domain.WrittenTranslations.from_dict(
                written_translations_dict))

        exp_services.save_new_exploration(self.albert_id, exploration)

        job_id = (
            exp_jobs_one_off
            .ExplorationRteMathContentValidationOneOffJob.create_new())
        (
            exp_jobs_one_off.
            ExplorationRteMathContentValidationOneOffJob.enqueue(
                job_id))
        self.process_and_flush_pending_mapreduce_tasks()
        actual_output = (
            exp_jobs_one_off
            .ExplorationRteMathContentValidationOneOffJob.get_output(
                job_id))
        detailed_info_output = ast.literal_eval(actual_output[1])

        invalid_tag1 = (
            '<oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';mathImg_20201216*331234_r3ir43lmfd_height_2d456_width_6d1'
            '24_vertical_0d231.svg&amp;quot;}"></oppia-noninteractive-math>')
        invalid_tag2 = (
            '<oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;-,-,-,-'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';mathImg_20200216_133832_imzlvnf23a_invalid_4d123_width_23d'
            '122_vertical_2d123.svg&amp;quot;}"></oppia-noninteractive-math>')
        expected_invalid_tags = [invalid_tag1, invalid_tag2]
        exp_error_info = detailed_info_output[1][self.VALID_EXP_ID]
        for state_error_info in exp_error_info:
            for invalid_tag_info in state_error_info['error_list']:
                self.assertTrue(
                    invalid_tag_info['invalid_tag'] in expected_invalid_tags)

        overall_result = ast.literal_eval(actual_output[0])
        self.assertEqual(overall_result[1]['no_of_invalid_tags'], 6)
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
            exp_jobs_one_off.
            ExplorationRteMathContentValidationOneOffJob)

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
            ';mathImg_20201216_331234_r3ir43lmfd_height_2d456_width_6d1'
            '24_vertical_0d231.svg&amp;quot;}"></oppia-noninteractive-math>')

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
            .ExplorationRteMathContentValidationOneOffJob.create_new())
        (
            exp_jobs_one_off.
            ExplorationRteMathContentValidationOneOffJob.enqueue(
                job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationRteMathContentValidationOneOffJob.get_output(
                job_id))
        self.assertEqual(len(actual_output), 0)


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
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.process_and_flush_pending_mapreduce_tasks()

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
            self.process_and_flush_pending_mapreduce_tasks()

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
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            self.VALID_EXP_ID)

        job_id = (
            exp_jobs_one_off
            .RTECustomizationArgsValidationOneOffJob.create_new())
        (
            exp_jobs_one_off
            .RTECustomizationArgsValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off
            .RTECustomizationArgsValidationOneOffJob.get_output(
                job_id))
        expected_output = [
            u'[u\'Error Sorry, we can only process v41-v%s exploration state '
            'schemas at present. when loading exploration\', '
            '[u\'exp_id0\']]' % feconf.CURRENT_STATE_SCHEMA_VERSION]

        self.assertEqual(actual_output, expected_output)


class XmlnsAttributeInExplorationMathSvgImagesAuditJobTests(
        test_utils.GenericTestBase):
    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            XmlnsAttributeInExplorationMathSvgImagesAuditJobTests,
            self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        self.process_and_flush_pending_tasks()

    def test_reports_math_svgs_without_xmlns_attributes(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.VALID_EXP_ID))

        invalid_svg_string = (
            '<svg version="1.0" width="100pt" height="100pt" '
            'viewBox="0 0 100 100"><g><path d="M5455 '
            '2632 9z"/></g><text transform="matrix(1 0 0 -1 0 0)" font-size'
            '="884px" font-family="serif">Ì</text></svg>')

        svg_filename = 'mathImg_12ab_height_1d2_width_2d3_vertical_3d2.svg'

        fs.commit(
            'image/%s' % svg_filename, invalid_svg_string,
            mimetype='image/svg+xml')

        job_id = (
            exp_jobs_one_off
            .XmlnsAttributeInExplorationMathSvgImagesAuditJob.create_new())
        (
            exp_jobs_one_off
            .XmlnsAttributeInExplorationMathSvgImagesAuditJob
            .enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off
            .XmlnsAttributeInExplorationMathSvgImagesAuditJob
            .get_output(job_id))

        self.assertEqual(actual_output, [
            u'[u\'exp_id0\', '
            u'[u\'mathImg_12ab_height_1d2_width_2d3_vertical_3d2.svg\']]'
        ])

    def test_no_action_is_performed_on_non_math_svgs(self):
        """Test that no action is performed on non-math SVGs."""

        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.VALID_EXP_ID))

        old_svg_string = (
            '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" '
            'width="100pt" height="100pt" '
            'viewBox="0 0 100 100"><g><path d="M5455 '
            '2632 9z"/></g><text transform="matrix(1 0 0 -1 0 0)" font-size'
            '="884px" font-family="serif">Ì</text></svg>')

        svg_filename = 'random_12ab_height_1d2_width_2d3_vertical_3d2.svg'

        filepath = 'image/%s' % svg_filename
        fs.commit(filepath, old_svg_string, mimetype='image/svg+xml')

        job_id = (
            exp_jobs_one_off
            .XmlnsAttributeInExplorationMathSvgImagesAuditJob.create_new())
        (
            exp_jobs_one_off
            .XmlnsAttributeInExplorationMathSvgImagesAuditJob
            .enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off
            .XmlnsAttributeInExplorationMathSvgImagesAuditJob
            .get_output(job_id))

        self.assertEqual(actual_output, [])

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.VALID_EXP_ID))

        invalid_svg_string = (
            '<svg version="1.0" role="" width="100pt" height="100pt" '
            'viewBox="0 0 100 100"><g><path d="M5455 '
            '2632 9z"/></g><text transform="matrix(1 0 0 -1 0 0)" font-size'
            '="884px" font-family="serif">Ì</text></svg>')

        svg_filename = 'mathImg_12ab_height_1d2_width_2d3_vertical_3d2.svg'

        fs.commit(
            'image/%s' % svg_filename, invalid_svg_string,
            mimetype='image/svg+xml')

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self,
            exp_jobs_one_off
            .XmlnsAttributeInExplorationMathSvgImagesAuditJob)


class MockExpSummaryModel(exp_models.ExpSummaryModel):
    """Mock ExpSummaryModel so that it allows to set `translator_ids`."""

    translator_ids = datastore_services.StringProperty(
        indexed=True, repeated=True, required=False)


class RegenerateStringPropertyIndexOneOffJobTests(test_utils.GenericTestBase):

    JOB = exp_jobs_one_off.RegenerateStringPropertyIndexOneOffJob

    def run_job(self):
        """Runs the job and returns its output."""
        job_id = self.JOB.create_new()
        self.JOB.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        return [ast.literal_eval(s) for s in self.JOB.get_output(job_id)]

    def test_outputs_successful_writes(self):
        self.save_new_valid_exploration('exp1', 'owner1')
        self.save_new_valid_exploration('exp2', 'owner2')
        improvements_models.TaskEntryModel.create(
            'exploration', 'eid', 1, 'high_bounce_rate', 'state',
            'Introduction')

        self.assertItemsEqual(
            self.run_job(), [['ExplorationModel', 2], ['TaskEntryModel', 1]])

    def test_versioned_models_are_not_changed_to_a_newer_version(self):
        self.save_new_valid_exploration('exp1', 'owner1')

        self.assertItemsEqual(self.run_job(), [['ExplorationModel', 1]])

        exp_model = exp_models.ExplorationModel.get_by_id('exp1')
        self.assertEqual(exp_model.version, 1)


class RegenerateMissingExpCommitLogModelsTests(test_utils.GenericTestBase):

    def setUp(self):
        super(RegenerateMissingExpCommitLogModelsTests, self).setUp()

        self.signup('user@email', 'user')
        self.user_id = self.get_user_id_from_email('user@email')
        self.user = user_services.get_user_actions_info(self.user_id)
        self.set_admins(['user'])

        self.save_new_valid_exploration(
            '0', self.user_id, end_state_name='End')

    def test_standard_operation(self):
        job_id = (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.create_new())
        (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.get_output(job_id))
        self.assertEqual(output, [])

    def test_no_action_is_performed_for_deleted_exploration(self):
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-1'))
        commit_log_model.delete()
        exp_services.delete_exploration(self.user_id, '0')

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.RegenerateMissingExpCommitLogModels,
            exp_id='0')

    def test_migration_job_regenerates_missing_model_with_only_one_rights_model(
            self):
        # Commit log v2 will be created.
        exp_services.update_exploration(
            self.user_id, '0', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Updated title.')
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-2'))
        actual_commit_log_details = [
            commit_log_model.user_id, commit_log_model.commit_type,
            commit_log_model.commit_message, commit_log_model.commit_cmds,
            commit_log_model.version, commit_log_model.post_commit_status,
            commit_log_model.post_commit_community_owned,
            commit_log_model.post_commit_is_private,
            commit_log_model.exploration_id
        ]

        commit_log_model.delete()

        job_id = (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.create_new())
        (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.get_output(job_id))
        regenerated_commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-2'))
        regenerated_commit_log_details = [
            regenerated_commit_log_model.user_id,
            regenerated_commit_log_model.commit_type,
            regenerated_commit_log_model.commit_message,
            regenerated_commit_log_model.commit_cmds,
            regenerated_commit_log_model.version,
            regenerated_commit_log_model.post_commit_status,
            regenerated_commit_log_model.post_commit_community_owned,
            regenerated_commit_log_model.post_commit_is_private,
            regenerated_commit_log_model.exploration_id
        ]
        self.assertFalse(regenerated_commit_log_model.deleted)
        self.assertEqual(
            actual_commit_log_details, regenerated_commit_log_details)
        self.assertEqual(
            output, [
                '[u\'Regenerated Exploration Commit Log Model: version 2\', '
                '[u\'0\']]'])

    def test_migration_job_regenerates_missing_model_when_rights_not_updated(
            self):
        # Commit log v2 will be created.
        exp_services.update_exploration(
            self.user_id, '0', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Updated title.')
        # Rights updated.
        rights_manager.publish_exploration(self.user, '0')
        # Commit log v3 will be created.
        exp_services.update_exploration(
            self.user_id, '0', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Updated title.')
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-2'))
        actual_commit_log_details = [
            commit_log_model.user_id, commit_log_model.commit_type,
            commit_log_model.commit_message, commit_log_model.commit_cmds,
            commit_log_model.version, commit_log_model.post_commit_status,
            commit_log_model.post_commit_community_owned,
            commit_log_model.post_commit_is_private,
            commit_log_model.exploration_id
        ]

        commit_log_model.delete()

        job_id = (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.create_new())
        (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.get_output(job_id))
        regenerated_commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-2'))
        regenerated_commit_log_details = [
            regenerated_commit_log_model.user_id,
            regenerated_commit_log_model.commit_type,
            regenerated_commit_log_model.commit_message,
            regenerated_commit_log_model.commit_cmds,
            regenerated_commit_log_model.version,
            regenerated_commit_log_model.post_commit_status,
            regenerated_commit_log_model.post_commit_community_owned,
            regenerated_commit_log_model.post_commit_is_private,
            regenerated_commit_log_model.exploration_id
        ]
        self.assertFalse(regenerated_commit_log_model.deleted)
        self.assertEqual(
            actual_commit_log_details, regenerated_commit_log_details)
        self.assertEqual(
            output, [
                '[u\'Regenerated Exploration Commit Log Model: version 2\', '
                '[u\'0\']]'])

    def test_migration_job_regenerates_missing_model_when_rights_are_updated(
            self):
        # Commit log v2 will be created.
        exp_services.update_exploration(
            self.user_id, '0', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Updated title.')
        # Rights updated.
        rights_manager.publish_exploration(self.user, '0')
        # Commit log v3 will be created.
        exp_services.update_exploration(
            self.user_id, '0', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Updated title.')
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-3'))
        actual_commit_log_details = [
            commit_log_model.user_id, commit_log_model.commit_type,
            commit_log_model.commit_message, commit_log_model.commit_cmds,
            commit_log_model.version, commit_log_model.post_commit_status,
            commit_log_model.post_commit_community_owned,
            commit_log_model.post_commit_is_private,
            commit_log_model.exploration_id
        ]

        commit_log_model.delete()

        job_id = (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.create_new())
        (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .RegenerateMissingExpCommitLogModels.get_output(job_id))
        regenerated_commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-3'))
        regenerated_commit_log_details = [
            regenerated_commit_log_model.user_id,
            regenerated_commit_log_model.commit_type,
            regenerated_commit_log_model.commit_message,
            regenerated_commit_log_model.commit_cmds,
            regenerated_commit_log_model.version,
            regenerated_commit_log_model.post_commit_status,
            regenerated_commit_log_model.post_commit_community_owned,
            regenerated_commit_log_model.post_commit_is_private,
            regenerated_commit_log_model.exploration_id
        ]
        self.assertFalse(regenerated_commit_log_model.deleted)
        self.assertEqual(
            actual_commit_log_details, regenerated_commit_log_details)
        self.assertEqual(
            output, [
                '[u\'Regenerated Exploration Commit Log Model: version 3\', '
                '[u\'0\']]'])


class ExpCommitLogModelRegenerationValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExpCommitLogModelRegenerationValidatorTests, self).setUp()

        self.signup('user@email', 'user')
        self.user_id = self.get_user_id_from_email('user@email')
        self.set_admins(['user'])
        self.exp_id = '0b'

        exp = exp_domain.Exploration.create_default_exploration(
            self.exp_id,
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.user_id, exp)

    def test_standard_operation(self):
        job_id = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.create_new())
        (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.get_output(job_id))
        self.assertEqual(output, [])

    def test_no_action_is_performed_for_deleted_exploration(self):
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.exp_id))
        commit_log_model.delete()
        exp_services.delete_exploration(self.user_id, self.exp_id)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.ExpCommitLogModelRegenerationValidator,
            exp_id=self.exp_id)

    def test_no_action_is_performed_for_exp_not_satisfying_id_constraint(self):
        exp = exp_domain.Exploration.create_default_exploration(
            '0z',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.user_id, exp)
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0z-1'))
        commit_log_model.delete()

        job_id = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.create_new())
        (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.get_output(job_id))
        self.assertEqual(output, [])

    def test_validation_job_skips_check_for_deleted_commit_log_model(self):
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.exp_id))
        commit_log_model.delete()

        job_id = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.create_new())
        (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.get_output(job_id))
        self.assertEqual(output, [])

    def test_validation_job_catches_mismatch_in_non_datetime_fields(self):
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.exp_id))
        commit_log_model.commit_message = 'Test change'
        commit_log_model.update_timestamps()
        commit_log_model.put()

        job_id = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.create_new())
        (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.get_output(job_id))
        expected_output = [(
            '[u\'Mismatch between original model and regenerated model\', '
            '[u"commit_message in original model: Test change, '
            'in regenerated model: New exploration created with title '
            '\'title 0\'."]]')]
        self.assertEqual(output, expected_output)

    def test_validation_job_catches_mismatch_in_datetime_fields(self):
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.exp_id))
        commit_log_model.created_on = commit_log_model.created_on + (
            datetime.timedelta(days=1))
        commit_log_model.update_timestamps()
        commit_log_model.put()

        job_id = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.create_new())
        (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            exp_jobs_one_off
            .ExpCommitLogModelRegenerationValidator.get_output(job_id))

        metadata_model = exp_models.ExplorationSnapshotMetadataModel.get_by_id(
            '%s-1' % self.exp_id)
        expected_output = [(
            '[u\'Mismatch between original model and regenerated model\', '
            '[u\'created_on in original model: %s, '
            'in regenerated model: %s\']]' % (
                commit_log_model.created_on, metadata_model.created_on))]
        self.assertEqual(output, expected_output)


class ExpSnapshotsMigrationAuditJobTests(test_utils.GenericTestBase):
    """Tests for ExplorationMigrationAuditJob."""

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ExpSnapshotsMigrationAuditJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

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

    def test_migration_audit_job_does_not_convert_up_to_date_exp(self):
        """Tests that the snapshot migration audit job does not convert a
        snapshot that is already the latest states schema version.
        """
        # Create a new, default exploration whose snapshots should not be
        # affected by the job.
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.update_interaction_default_outcome(None)
        exp_services.save_new_exploration(self.albert_id, exploration)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.create_new()
        exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.get_output(job_id))
        expected_output = [
            '[u\'SUCCESS - Snapshot is already at latest schema version\', 1]']
        self.assertEqual(actual_output, expected_output)

    def test_migration_audit_job_skips_deleted_explorations(self):
        """Tests that the snapshot migration job skips deleted explorations
        and does not attempt to migrate any of the snapshots.
        """
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE)
            exp_services.save_new_exploration(self.albert_id, exploration)

        # Note: This creates a summary based on the upgraded model (which is
        # fine). A summary is needed to delete the exploration.
        exp_services.regenerate_exploration_and_contributors_summaries(
            self.NEW_EXP_ID)

        # Delete the exploration before migration occurs.
        exp_services.delete_exploration(self.albert_id, self.NEW_EXP_ID)

        # Ensure the exploration is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.create_new()
        exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.enqueue(job_id)

        # This running without errors indicates the deleted exploration is
        # being ignored, since otherwise exp_fetchers.get_exploration_by_id
        # (used within the job) will raise an error.
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.get_output(
                job_id))
        expected_output_choices = [
            '[u\'INFO - Exploration does not exist\', [u\'%s-1\', u\'%s-2\']]' %
            (self.NEW_EXP_ID, self.NEW_EXP_ID),
            '[u\'INFO - Exploration does not exist\', [u\'%s-2\', u\'%s-1\']]' %
            (self.NEW_EXP_ID, self.NEW_EXP_ID)
        ]
        self.assertEqual(len(actual_output), 1)
        self.assertIn(actual_output[0], expected_output_choices)

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

    def test_migration_job_audit_success(self):
        """Test that the audit job runs correctly on snapshots that use a
        previous state schema.
        """
        swap_states_schema_version = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_version = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_version, swap_exp_schema_version:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(self.albert_id, exploration)
        self.assertLess(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Bring the main exploration to the latest schema.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])
        latest_schema_version = python_utils.UNICODE(
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '41',
                'to_version': latest_schema_version
            })
        ]
        exp_services.update_exploration(
            self.albert_id, self.VALID_EXP_ID, migration_change_list,
            'Ran Exploration Migration job.')
        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        self.assertEqual(
            exploration_model.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        job_id = exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.create_new()
        exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.get_output(
                job_id))
        expected_output = [
            '[u\'SUCCESS\', 1]',
            '[u\'SUCCESS - Snapshot is already at latest schema version\', 1]'
        ]
        self.assertEqual(sorted(actual_output), sorted(expected_output))

    def test_migration_job_audit_failure(self):
        """Test that the audit job catches any errors that would otherwise
        occur during the migration.
        """
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(self.albert_id, exploration)

        # Bring the main exploration to the latest schema.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])
        latest_schema_version = python_utils.UNICODE(
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '41',
                'to_version': latest_schema_version
            })
        ]
        exp_services.update_exploration(
            self.albert_id, self.VALID_EXP_ID, migration_change_list,
            'Ran Exploration Migration job.')
        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        self.assertEqual(
            exploration_model.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Make a mock conversion function that raises an error when trying to
        # convert the old snapshot.
        mock_conversion = classmethod(
            lambda cls, exploration_dict: exploration_dict['property_that_dne'])

        with self.swap(
            exp_domain.Exploration, '_convert_states_v41_dict_to_v42_dict',
            mock_conversion
        ):
            job_id = exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.create_new()
            exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.enqueue(job_id)
            self.process_and_flush_pending_mapreduce_tasks()

            actual_output = (
                exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.get_output(
                    job_id)
            )

        expected_output_message = (
            u'[u\'MIGRATION_ERROR\', [u"Exploration snapshot %s-1 failed '
            'migration to states v42: u\'property_that_dne\'"]]'
            % self.VALID_EXP_ID
        )
        self.assertIn(expected_output_message, actual_output)

    def test_audit_job_detects_invalid_exploration(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        exploration_model.language_code = 'invalid_language_code'
        exploration_model.commit(
            self.albert_id, 'Changed language_code.', [])
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])

        job_id = exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.create_new()
        exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.get_output(job_id))
        expected_output_message = (
            '[u\'INFO - Exploration %s-1 failed non-strict validation\', '
            '[u\'Invalid language_code: invalid_language_code\']]'
            % self.VALID_EXP_ID)
        self.assertIn(expected_output_message, actual_output)

    def test_audit_job_detects_exploration_that_is_not_up_to_date(self):
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(self.albert_id, exploration)
        self.assertLess(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        swap_states_schema_42 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_47 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 47)
        with swap_states_schema_42, swap_exp_schema_47:
            job_id = exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.create_new()
            exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.enqueue(job_id)
            self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationAuditJob.get_output(
                job_id))
        expected_output = [
            '[u\'FAILURE - Exploration is not at latest schema version\', '
            '[u\'%s\']]' % self.VALID_EXP_ID,
        ]
        self.assertEqual(sorted(actual_output), sorted(expected_output))


class ExpSnapshotsMigrationJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ExpSnapshotsMigrationJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_migration_job_does_not_convert_up_to_date_exp(self):
        """Tests that the exploration migration job does not convert a
        snapshot that is already the latest states schema version.
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

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExpSnapshotsMigrationJob.create_new()
        exp_jobs_one_off.ExpSnapshotsMigrationJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationJob.get_output(job_id))
        expected_output = [
            '[u\'SUCCESS - Snapshot is already at latest schema version\', 1]']
        self.assertEqual(actual_output, expected_output)

    def test_migration_job_succeeds_on_default_exploration(self):
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(self.albert_id, exploration)

        # Bring the main exploration to schema version 42.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': (
                    exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION),
                'from_version': '41',
                'to_version': '42'
            })
        ]
        swap_states_schema_42 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_47 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 47)
        with swap_states_schema_42, swap_exp_schema_47:
            exp_services.update_exploration(
                self.albert_id, self.VALID_EXP_ID, migration_change_list,
                'Ran Exploration Migration job.')

            job_id = exp_jobs_one_off.ExpSnapshotsMigrationJob.create_new()
            exp_jobs_one_off.ExpSnapshotsMigrationJob.enqueue(job_id)
            self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationJob.get_output(job_id))
        expected_output = [
            '[u\'SUCCESS - Model saved\', 1]',
            '[u\'SUCCESS - Model upgraded\', 1]',
            '[u\'SUCCESS - Snapshot is already at latest schema version\', 1]']
        self.assertEqual(sorted(actual_output), sorted(expected_output))

    def test_migration_job_skips_deleted_explorations(self):
        """Tests that the exploration migration job skips deleted explorations
        and does not attempt to migrate.
        """
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE)
            exp_services.save_new_exploration(self.albert_id, exploration)

        # Note: This creates a summary based on the upgraded model (which is
        # fine). A summary is needed to delete the exploration.
        exp_services.regenerate_exploration_and_contributors_summaries(
            self.NEW_EXP_ID)

        # Delete the exploration before migration occurs.
        exp_services.delete_exploration(self.albert_id, self.NEW_EXP_ID)

        # Ensure the exploration is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExpSnapshotsMigrationJob.create_new()
        exp_jobs_one_off.ExpSnapshotsMigrationJob.enqueue(job_id)

        # This running without errors indicates the deleted exploration is
        # being ignored, since otherwise exp_fetchers.get_exploration_by_id
        # (used within the job) will raise an error.
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationJob.get_output(job_id))
        expected_output_choices = [
            '[u\'INFO - Exploration does not exist\', [u\'%s-1\', u\'%s-2\']]' %
            (self.NEW_EXP_ID, self.NEW_EXP_ID),
            '[u\'INFO - Exploration does not exist\', [u\'%s-2\', u\'%s-1\']]' %
            (self.NEW_EXP_ID, self.NEW_EXP_ID)
        ]
        self.assertEqual(len(actual_output), 1)
        self.assertIn(actual_output[0], expected_output_choices)

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

    def test_migration_job_detects_invalid_exploration(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        exploration_model.language_code = 'invalid_language_code'
        exploration_model.commit(
            self.albert_id, 'Changed language_code.', [])
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])

        job_id = exp_jobs_one_off.ExpSnapshotsMigrationJob.create_new()
        exp_jobs_one_off.ExpSnapshotsMigrationJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationJob.get_output(job_id))
        expected_output_message = (
            '[u\'INFO - Exploration %s-1 failed non-strict validation\', '
            '[u\'Invalid language_code: invalid_language_code\']]'
            % self.VALID_EXP_ID)
        self.assertIn(expected_output_message, actual_output)

    def test_migration_job_detects_exploration_that_is_not_up_to_date(self):
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(self.albert_id, exploration)
        self.assertLess(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        swap_states_schema_42 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_47 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 47)
        with swap_states_schema_42, swap_exp_schema_47:
            job_id = exp_jobs_one_off.ExpSnapshotsMigrationJob.create_new()
            exp_jobs_one_off.ExpSnapshotsMigrationJob.enqueue(job_id)
            self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            exp_jobs_one_off.ExpSnapshotsMigrationJob.get_output(
                job_id))
        expected_output = [
            '[u\'FAILURE - Exploration is not at latest schema version\', '
            '[u\'%s\']]' % self.VALID_EXP_ID,
        ]
        self.assertEqual(sorted(actual_output), sorted(expected_output))


class RatioTermsAuditOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(RatioTermsAuditOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_number_of_ratio_terms_tabulated_are_correct_in_single_exp(self):
        """Checks that correct number of ratio terms are shown when
        there is single exploration.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1', 'State2', 'State3'])

        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        id1 = 'RatioExpressionInput'
        id2 = 'RatioExpressionInput'
        carg1 = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'numberOfTerms': {
                'value': 5
            }
        }
        carg2 = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'numberOfTerms': {
                'value': 12
            }
        }
        state1.update_interaction_id(id1)
        state2.update_interaction_id(id2)
        state1.update_interaction_customization_args(carg1)
        state2.update_interaction_customization_args(carg2)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start RatioTermsAuditOneOff job on sample exploration.
        job_id = exp_jobs_one_off.RatioTermsAuditOneOffJob.create_new()
        exp_jobs_one_off.RatioTermsAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = exp_jobs_one_off.RatioTermsAuditOneOffJob.get_output(
            job_id)
        expected_output = [
            '[u\'SUCCESS\', 1]',
            '[u\'12\', [u\'exp_id0 State2\']]'
        ]
        self.assertEqual(actual_output, expected_output)

    def test_number_of_ratio_terms_tabulated_are_correct_in_multiple_exps(self):
        """Checks that correct number of ratio terms are shown when
        there are multiple explorations.
        """

        exploration1 = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration1.add_states(['State1', 'State2', 'State3'])

        state1 = exploration1.states['State1']
        state2 = exploration1.states['State2']
        id1 = 'RatioExpressionInput'
        id2 = 'RatioExpressionInput'
        carg1 = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'numberOfTerms': {
                'value': 5
            }
        }
        carg2 = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'numberOfTerms': {
                'value': 12
            }
        }
        state1.update_interaction_id(id1)
        state2.update_interaction_id(id2)
        state1.update_interaction_customization_args(carg1)
        state2.update_interaction_customization_args(carg2)
        exp_services.save_new_exploration(self.albert_id, exploration1)

        exploration2 = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title='title', category='category')

        exploration2.add_states(['State1', 'State2'])

        state1 = exploration2.states['State1']
        id1 = 'RatioExpressionInput'
        carg1 = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'numberOfTerms': {
                'value': 11
            }
        }
        state1.update_interaction_id(id1)
        state1.update_interaction_customization_args(carg1)

        exp_services.save_new_exploration(self.albert_id, exploration2)

        # Start RatioTermsAuditOneOff job on sample exploration.
        job_id = exp_jobs_one_off.RatioTermsAuditOneOffJob.create_new()
        exp_jobs_one_off.RatioTermsAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = exp_jobs_one_off.RatioTermsAuditOneOffJob.get_output(
            job_id)

        actual_output_dict = {}

        for item in [ast.literal_eval(value) for value in actual_output]:
            if item[0] != 'SUCCESS':
                actual_output_dict[item[0]] = set(item[1])
            else:
                actual_output_dict['SUCCESS'] = item[1]

        expected_output_dict = {
            '12': set(['exp_id0 State2']),
            '11': set(['exp_id1 State1']),
            'SUCCESS': 2
        }

        self.assertEqual(actual_output_dict, expected_output_dict)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        id1 = 'RatioExpressionInput'
        carg1 = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'numberOfTerms': {
                'value': 11
            }
        }
        state1.update_interaction_id(id1)
        state1.update_interaction_customization_args(carg1)
        exp_services.save_new_exploration(self.albert_id, exploration)
        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(self, exp_jobs_one_off.RatioTermsAuditOneOffJob)


class ExpSnapshotsDeletionJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    EXP_ID = 'exp_id0'

    def setUp(self):
        super(ExpSnapshotsDeletionJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = exp_jobs_one_off.ExpSnapshotsDeletionJob.create_new()
        exp_jobs_one_off.ExpSnapshotsDeletionJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            exp_jobs_one_off.ExpSnapshotsDeletionJob.get_output(job_id))
        eval_output = [
            ast.literal_eval(stringified_item)
            for stringified_item in stringified_output
        ]
        return eval_output

    def test_deletion_job_deletes_snapshot_content_model(self):
        exp_models.ExplorationModel.delete_by_id(self.EXP_ID)
        exp_models.ExplorationSnapshotMetadataModel.delete_by_id(
            '%s-1' % self.EXP_ID)
        exp_models.ExplorationRightsSnapshotContentModel.delete_by_id(
            '%s-1' % self.EXP_ID)
        exp_models.ExplorationRightsSnapshotMetadataModel.delete_by_id(
            '%s-1' % self.EXP_ID)

        self.assertIsNotNone(
            exp_models.ExplorationSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS_DELETED - ExplorationSnapshotContentModel', 1]]
        )

        self.assertIsNone(
            exp_models.ExplorationSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))

    def test_deletion_job_deletes_snapshot_metadata_model(self):
        exp_models.ExplorationModel.delete_by_id(self.EXP_ID)
        exp_models.ExplorationSnapshotContentModel.delete_by_id(
            '%s-1' % self.EXP_ID)
        exp_models.ExplorationRightsSnapshotContentModel.delete_by_id(
            '%s-1' % self.EXP_ID)
        exp_models.ExplorationRightsSnapshotMetadataModel.delete_by_id(
            '%s-1' % self.EXP_ID)

        self.assertIsNotNone(
            exp_models.ExplorationSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS_DELETED - ExplorationSnapshotMetadataModel', 1]]
        )

        self.assertIsNone(
            exp_models.ExplorationSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))

    def test_deletion_job_deletes_right_snapshot_content_model(self):
        exp_models.ExplorationModel.delete_by_id(self.EXP_ID)
        exp_models.ExplorationSnapshotContentModel.delete_by_id(
            '%s-1' % self.EXP_ID)
        exp_models.ExplorationSnapshotMetadataModel.delete_by_id(
            '%s-1' % self.EXP_ID)
        exp_models.ExplorationRightsSnapshotMetadataModel.delete_by_id(
            '%s-1' % self.EXP_ID)

        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [['SUCCESS_DELETED - ExplorationRightsSnapshotContentModel', 1]]
        )

        self.assertIsNone(
            exp_models.ExplorationRightsSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))

    def test_deletion_job_deletes_right_snapshot_metadata_model(self):
        exp_models.ExplorationModel.delete_by_id(self.EXP_ID)
        exp_models.ExplorationSnapshotContentModel.delete_by_id(
            '%s-1' % self.EXP_ID)
        exp_models.ExplorationSnapshotMetadataModel.delete_by_id(
            '%s-1' % self.EXP_ID)
        exp_models.ExplorationRightsSnapshotContentModel.delete_by_id(
            '%s-1' % self.EXP_ID)

        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [['SUCCESS_DELETED - ExplorationRightsSnapshotMetadataModel', 1]]
        )

        self.assertIsNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))

    def test_deletion_job_deletes_all_snapshot_models(self):
        exp_models.ExplorationModel.delete_by_id(self.EXP_ID)
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['SUCCESS_DELETED - ExplorationSnapshotContentModel', 1],
                ['SUCCESS_DELETED - ExplorationSnapshotMetadataModel', 1],
                ['SUCCESS_DELETED - ExplorationRightsSnapshotContentModel', 1],
                ['SUCCESS_DELETED - ExplorationRightsSnapshotMetadataModel', 1]
            ]
        )

        self.assertIsNone(
            exp_models.ExplorationSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNone(
            exp_models.ExplorationSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNone(
            exp_models.ExplorationRightsSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))

    def test_deletion_job_does_not_delete_models(self):
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['SUCCESS_PASS - ExplorationSnapshotContentModel', 1],
                ['SUCCESS_PASS - ExplorationSnapshotMetadataModel', 1],
                ['SUCCESS_PASS - ExplorationRightsSnapshotContentModel', 1],
                ['SUCCESS_PASS - ExplorationRightsSnapshotMetadataModel', 1]
            ]
        )

        self.assertIsNotNone(
            exp_models.ExplorationSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotContentModel.get(
                '%s-1' % self.EXP_ID, strict=False))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get(
                '%s-1' % self.EXP_ID, strict=False))
