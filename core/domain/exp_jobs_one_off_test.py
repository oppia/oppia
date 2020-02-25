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

from constants import constants
from core import jobs_registry
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_jobs_one_off
from core.domain import exp_services
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


class ExpSummariesCreationOneOffJobTest(test_utils.GenericTestBase):
    """Tests for ExpSummary aggregations."""

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        exp_jobs_one_off.ExpSummariesCreationOneOffJob]

    # Specify explorations that will be used in the test.
    EXP_SPECS = [{
        'category': 'Category A',
        'title': 'Title 1'
    }, {
        'category': 'Category B',
        'title': 'Title 2'
    }, {
        'category': 'Category C',
        'title': 'Title 3'
    }, {
        'category': 'Category A',
        'title': 'Title 4'
    }, {
        'category': 'Category C',
        'title': 'Title 5'
    }]

    def setUp(self):
        super(ExpSummariesCreationOneOffJobTest, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.login(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)

    def test_all_exps_public(self):
        """Test summary batch job if all explorations are public."""
        self._run_batch_job_once_and_verify_output(
            self.EXP_SPECS,
            default_status=rights_manager.ACTIVITY_STATUS_PUBLIC)

    def test_all_exps_private(self):
        """Test summary batch job if all explorations are private."""
        self._run_batch_job_once_and_verify_output(
            self.EXP_SPECS,
            default_status=rights_manager.ACTIVITY_STATUS_PRIVATE)

    def _run_batch_job_once_and_verify_output(
            self, exp_specs,
            default_title='A title',
            default_category='A category',
            default_status=rights_manager.ACTIVITY_STATUS_PUBLIC):
        """Run batch job for creating exploration summaries once and verify its
        output. exp_specs is a list of dicts with exploration specifications.
        Allowed keys are category, status, title. If a key is not specified,
        the default value is used.
        """
        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS',
            self.ONE_OFF_JOB_MANAGERS_FOR_TESTS
            ):

            default_spec = {
                'title': default_title,
                'category': default_category,
                'status': default_status
            }

            # Create and delete an exploration (to make sure job handles
            # deleted explorations correctly).
            exp_id = '100'
            self.save_new_valid_exploration(
                exp_id,
                self.admin_id,
                title=default_spec['title'],
                category=default_spec['category'])
            exploration = exp_fetchers.get_exploration_by_id(exp_id)
            exp_services.delete_exploration(self.admin_id, exp_id)

            # Get dummy explorations.
            num_exps = len(exp_specs)
            expected_job_output = {}

            for ind in python_utils.RANGE(num_exps):
                exp_id = python_utils.convert_to_bytes(ind)
                spec = default_spec
                spec.update(exp_specs[ind])

                exploration = exp_domain.Exploration.create_default_exploration(
                    exp_id, title=spec['title'], category=spec['category'])
                exploration.tags = ['computer science', 'analysis', 'a b c']
                exp_services.save_new_exploration(self.admin_id, exploration)

                exploration = exp_fetchers.get_exploration_by_id(exp_id)

                rights_manager.assign_role_for_exploration(
                    self.admin, exp_id, self.voice_artist_id, 'voice artist')
                rights_manager.assign_role_for_exploration(
                    self.admin, exp_id, self.viewer_id, 'viewer')
                rights_manager.assign_role_for_exploration(
                    self.admin, exp_id, self.editor_id, 'editor')

                # Publish exploration.
                if spec['status'] == rights_manager.ACTIVITY_STATUS_PUBLIC:
                    rights_manager.publish_exploration(self.admin, exp_id)

                # Do not include user_id here, so all explorations are not
                # editable for now (will be updated depending on user_id
                # in galleries).
                exp_rights_model = exp_models.ExplorationRightsModel.get(
                    exp_id)

                exploration = exp_fetchers.get_exploration_by_id(exp_id)
                exploration_model_last_updated = exploration.last_updated
                exploration_model_created_on = exploration.created_on
                first_published_msec = (
                    exp_rights_model.first_published_msec)

                # Manually create the expected summary specifying title,
                # category, etc.
                expected_job_output[exp_id] = exp_domain.ExplorationSummary(
                    exp_id,
                    spec['title'],
                    spec['category'],
                    exploration.objective,
                    exploration.language_code,
                    exploration.tags,
                    feconf.get_empty_ratings(),
                    feconf.EMPTY_SCALED_AVERAGE_RATING,
                    spec['status'],
                    exp_rights_model.community_owned,
                    exp_rights_model.owner_ids,
                    exp_rights_model.editor_ids,
                    exp_rights_model.voice_artist_ids,
                    exp_rights_model.viewer_ids,
                    [self.admin_id],
                    {self.admin_id: 1},
                    exploration.version,
                    exploration_model_created_on,
                    exploration_model_last_updated,
                    first_published_msec)

                # Note: Calling constructor for fields that are not required
                # and have no default value does not work, because
                # unspecified fields will be empty list in
                # expected_job_output but will be unspecified in
                # actual_job_output.
                if exploration.tags:
                    expected_job_output[exp_id].tags = exploration.tags
                if exp_rights_model.owner_ids:
                    expected_job_output[exp_id].owner_ids = (
                        exp_rights_model.owner_ids)
                if exp_rights_model.editor_ids:
                    expected_job_output[exp_id].editor_ids = (
                        exp_rights_model.editor_ids)
                if exp_rights_model.voice_artist_ids:
                    expected_job_output[exp_id].voice_artist_ids = (
                        exp_rights_model.voice_artist_ids)
                if exp_rights_model.viewer_ids:
                    expected_job_output[exp_id].viewer_ids = (
                        exp_rights_model.viewer_ids)
                if exploration.version:
                    expected_job_output[exp_id].version = (
                        exploration.version)

            # Run batch job.
            job_id = (
                exp_jobs_one_off.ExpSummariesCreationOneOffJob.create_new())
            exp_jobs_one_off.ExpSummariesCreationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

            # Get and check job output.
            actual_job_output = exp_services.get_all_exploration_summaries()
            self.assertEqual(
                list(actual_job_output.keys()),
                list(expected_job_output.keys()))

            # Note: 'exploration_model_last_updated' is not expected to be the
            # same, because it is now read from the version model representing
            # the exploration's history snapshot, and not the ExplorationModel.
            simple_props = ['id', 'title', 'category', 'objective',
                            'language_code', 'tags', 'ratings', 'status',
                            'community_owned', 'owner_ids',
                            'editor_ids', 'voice_artist_ids', 'viewer_ids',
                            'contributor_ids', 'contributors_summary',
                            'version', 'exploration_model_created_on']
            for exp_id in actual_job_output:
                for prop in simple_props:
                    self.assertEqual(
                        getattr(actual_job_output[exp_id], prop),
                        getattr(expected_job_output[exp_id], prop))

    def test_exp_summaries_creation_job_output(self):
        """Test that ExpSummariesCreationOneOff job output is correct."""

        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS',
            self.ONE_OFF_JOB_MANAGERS_FOR_TESTS
            ):

            exp_id1 = '1'
            self.save_new_valid_exploration(
                exp_id1,
                self.admin_id,
                title='title',
                category='category')
            rights_manager.publish_exploration(self.admin, exp_id1)

            exp_id2 = '2'
            self.save_new_valid_exploration(
                exp_id2,
                self.admin_id,
                title='title',
                category='category')
            rights_manager.publish_exploration(self.admin, exp_id2)
            exp_services.delete_exploration(self.admin_id, exp_id2)

            # Run ExpSummariesCreationOneOff job on sample exploration.
            job_id = (
                exp_jobs_one_off.ExpSummariesCreationOneOffJob.create_new())
            exp_jobs_one_off.ExpSummariesCreationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

            actual_output = (
                exp_jobs_one_off.ExpSummariesCreationOneOffJob.get_output(
                    job_id))
            expected_output = ['[u\'SUCCESS\', 1]']
            self.assertEqual(actual_output, expected_output)


class ExpSummariesContributorsOneOffJobTests(test_utils.GenericTestBase):

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob]

    EXP_ID = 'exp_id'

    USERNAME_A = 'usernamea'
    USERNAME_B = 'usernameb'
    EMAIL_A = 'emaila@example.com'
    EMAIL_B = 'emailb@example.com'

    def setUp(self):
        super(ExpSummariesContributorsOneOffJobTests, self).setUp()

        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        self.signup(self.EMAIL_B, self.USERNAME_B)
        self.user_b_id = self.get_user_id_from_email(self.EMAIL_B)

    def test_contributors_for_valid_contribution(self):
        """Test that if only one commit is made, that the contributor
        list consists of that contributor's user id.
        """
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id)
        job_id = (
            exp_jobs_one_off.ExpSummariesContributorsOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual(
            [self.user_a_id], exploration_summary.contributor_ids)

    def test_repeat_contributors(self):
        """Test that if the same user makes more than one commit that changes
        the content of an exploration, the user is only represented once in the
        list of contributors for that exploration.
        """

        # Have one user make two commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Original Title')
        exploration_model = exp_models.ExplorationModel.get(
            self.EXP_ID, strict=True, version=None)
        exploration_model.title = 'New title'
        exploration_model.commit(
            self.user_a_id, 'Changed title.', [])

        # Run the job to compute the contributor ids.
        job_id = (
            exp_jobs_one_off.ExpSummariesContributorsOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify that the length of the contributor list is one, and that
        # the list contains the user who made these commits.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual(
            [self.user_a_id], exploration_summary.contributor_ids)

    def test_contributors_with_only_reverts_not_counted(self):
        """Test that contributors who have only done reverts do not
        have their user id appear in the contributor list.
        """
        # Have one user make two commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Original Title')
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'New title'
        })]
        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, change_list, 'Changed title.')

        # Have the second user revert version 2 to version 1.
        exp_services.revert_exploration(self.user_b_id, self.EXP_ID, 2, 1)

        # Run the job to compute the contributor ids.
        job_id = (
            exp_jobs_one_off.ExpSummariesContributorsOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify that the committer list does not contain the user
        # who only reverted.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual([self.user_a_id], exploration_summary.contributor_ids)

    def test_nonhuman_committers_not_counted(self):
        """Test that only human committers are counted as contributors."""

        # Create a commit with the system user id.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, feconf.SYSTEM_COMMITTER_ID, title='Original Title')
        # Run the job to compute the contributor ids.
        job_id = (
            exp_jobs_one_off.ExpSummariesContributorsOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        # Check that the system id was not added to the exploration's
        # contributor ids.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertNotIn(
            feconf.SYSTEM_COMMITTER_ID,
            exploration_summary.contributor_ids)

        # Create a commit with the migration bot user id.
        exploration_model = exp_models.ExplorationModel.get(
            self.EXP_ID, strict=True, version=None)
        exploration_model.title = 'New title'
        exploration_model.commit(
            feconf.MIGRATION_BOT_USERNAME, 'Changed title.', [])
        # Run the job to compute the contributor ids.
        job_id = (
            exp_jobs_one_off.ExpSummariesContributorsOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        # Check that the migration bot id was not added to the exploration's
        # contributor ids.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertNotIn(
            feconf.MIGRATION_BOT_USERNAME,
            exploration_summary.contributor_ids)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exp_id = '100'
        self.save_new_valid_exploration(exp_id, self.user_a_id)
        exp_services.delete_exploration(self.user_a_id, exp_id)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.ExpSummariesContributorsOneOffJob,
            function_to_be_called=exp_fetchers.get_exploration_summary_by_id,
            exp_id=exp_id)


class ExplorationContributorsSummaryOneOffJobTests(test_utils.GenericTestBase):
    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob]

    EXP_ID = 'exp_id'

    USERNAME_A = 'usernamea'
    USERNAME_B = 'usernameb'
    EMAIL_A = 'emaila@example.com'
    EMAIL_B = 'emailb@example.com'

    def setUp(self):
        super(ExplorationContributorsSummaryOneOffJobTests, self).setUp()
        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.signup(self.EMAIL_B, self.USERNAME_B)

        self.user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        self.user_b_id = self.get_user_id_from_email(self.EMAIL_B)

    def test_contributors_for_valid_nonrevert_contribution(self):
        """Test that if only non-revert commits are made by
        contributor then the contributions summary shows same
        exact number of commits for that contributor's ID.
        """

        # Let USER A make three commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Exploration Title')

        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            })], 'Changed title.')

        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            })], 'Changed Objective.')

        # Run the job to compute contributors summary.
        job_id = (
            exp_jobs_one_off
            .ExplorationContributorsSummaryOneOffJob.create_new()
        )
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)

        self.assertEqual(
            3, exploration_summary.contributors_summary[self.user_a_id])

    def test_contributors_with_only_reverts_not_included(self):
        """Test that if only reverts are made by contributor then the
        contributions summary shouldn’t contain that contributor’s ID.
        """

        # Let USER A make three commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Exploration Title 1')

        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            })], 'Changed title.')
        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            })], 'Changed Objective.')

        # Let the second user revert version 3 to version 2.
        exp_services.revert_exploration(self.user_b_id, self.EXP_ID, 3, 2)

        # Run the job to compute the contributors summary.
        job_id = (
            exp_jobs_one_off
            .ExplorationContributorsSummaryOneOffJob.create_new()
        )
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)

        # Check that the contributors_summary does not contains user_b_id.
        self.assertNotIn(
            self.user_b_id, exploration_summary.contributors_summary)

        # Check that the User A has only 2 commits after user b has reverted
        # to version 2.
        self.assertEqual(
            2, exploration_summary.contributors_summary[self.user_a_id])

    def test_reverts_not_counted(self):
        """Test that if both non-revert commits and revert are
        made by contributor then the contributions summary shows
        only non-revert commits for that contributor. However,
        the commits made after the version to which we have reverted
        shouldn't be counted either.
        """

        # Let USER A make 3 non-revert commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Exploration Title')
        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            })], 'Changed title.')
        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            })], 'Changed Objective.')

        # Let USER A revert version 3 to version 2.
        exp_services.revert_exploration(self.user_a_id, self.EXP_ID, 3, 2)

        # Run the job to compute the contributor summary.
        job_id = (
            exp_jobs_one_off
            .ExplorationContributorsSummaryOneOffJob.create_new()
        )
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Check that USER A's number of contributions is equal to 2.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual(
            2, exploration_summary.contributors_summary[self.user_a_id])

    def test_nonhuman_committers_not_counted(self):
        """Test that only human committers are counted as contributors."""

        # Create a commit with the system user id.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, feconf.SYSTEM_COMMITTER_ID, title='Original Title')

        # Create commits with all the system user ids.
        for system_id in constants.SYSTEM_USER_IDS:
            exp_services.update_exploration(
                system_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'Title changed by %s' % system_id
                })], 'Changed title.')

        # Run the job to compute the contributor summary.
        job_id = (
            exp_jobs_one_off
            .ExplorationContributorsSummaryOneOffJob.create_new())
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Check that no system id was added to the exploration's
        # contributor's summary.

        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)

        for system_id in constants.SYSTEM_USER_IDS:
            self.assertNotIn(
                system_id,
                exploration_summary.contributors_summary)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exp_id = '100'
        self.save_new_valid_exploration(exp_id, self.user_a_id)
        exp_services.delete_exploration(self.user_a_id, exp_id)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob,
            function_to_be_called=exp_fetchers.get_exploration_summary_by_id,
            exp_id=exp_id)

    def test_exploration_contributors_summary_job_output(self):
        """Test that ExplorationContributorsSummaryOneOff job output is
        correct.
        """
        self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Exploration Title')

        # Run the ExplorationContributorsSummaryOneOff job.
        job_id = (
            exp_jobs_one_off
            .ExplorationContributorsSummaryOneOffJob.create_new())
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.get_output(
                job_id))
        expected_output = ['[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)


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


class InteractionAuditOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(InteractionAuditOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_exp_state_pairs_are_produced_for_all_interactions_in_single_exp(
            self):
        """Checks (exp, state) pairs are produced for all interactions
        when there is single exploration.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['End'])
        intro_state = exploration.states['Introduction']
        end_state = exploration.states['End']

        intro_state.update_interaction_id('TextInput')
        end_state.update_interaction_id('EndExploration')
        end_state.update_interaction_default_outcome(None)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start InteractionAuditOneOff job on sample exploration.
        job_id = exp_jobs_one_off.InteractionAuditOneOffJob.create_new()
        exp_jobs_one_off.InteractionAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.InteractionAuditOneOffJob.get_output(
                job_id))
        expected_output = [
            '[u\'EndExploration\', [u\'exp_id0 End\']]',
            '[u\'TextInput\', [u\'exp_id0 Introduction\']]']
        self.assertEqual(actual_output, expected_output)

    def test_exp_state_pairs_are_produced_for_all_interactions_in_multiple_exps(
            self):
        """Checks (exp, state) pairs are produced for all interactions
        when there are multiple explorations.
        """
        exploration1 = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration1.add_states(['End'])
        intro_state = exploration1.states['Introduction']
        end_state = exploration1.states['End']

        intro_state.update_interaction_id('TextInput')
        end_state.update_interaction_id('EndExploration')
        end_state.update_interaction_default_outcome(None)

        exp_services.save_new_exploration(self.albert_id, exploration1)

        exploration2 = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title='title', category='category')

        exploration2.add_states(['End'])
        intro_state = exploration2.states['Introduction']
        end_state = exploration2.states['End']

        intro_state.update_interaction_id('ItemSelectionInput')
        end_state.update_interaction_id('EndExploration')
        end_state.update_interaction_default_outcome(None)

        exp_services.save_new_exploration(self.albert_id, exploration2)

        # Start InteractionAuditOneOff job on sample explorations.
        job_id = exp_jobs_one_off.InteractionAuditOneOffJob.create_new()
        exp_jobs_one_off.InteractionAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.InteractionAuditOneOffJob.get_output(
                job_id))

        actual_output_dict = {}

        for item in [ast.literal_eval(value) for value in actual_output]:
            actual_output_dict[item[0]] = set(item[1])

        expected_output_dict = {
            'EndExploration': set(['exp_id0 End', 'exp_id1 End']),
            'ItemSelectionInput': set(['exp_id1 Introduction']),
            'TextInput': set(['exp_id0 Introduction'])
        }

        self.assertEqual(actual_output_dict, expected_output_dict)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.InteractionAuditOneOffJob)


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

        hint_list1 = [{
            'hint_content': {
                'content_id': 'hint1',
                'html': '<p>Hello, this is html1 for state1</p>'
            }
        }, {
            'hint_content': {
                'content_id': 'hint2',
                'html': '<p>Hello, this is html2 for state1</p>'
            }
        }]

        hint_list2 = [{
            'hint_content': {
                'content_id': 'hint1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }]

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

        hint_list1 = [{
            'hint_content': {
                'content_id': 'hint1',
                'html': '<p>Hello, this is html1 for state1</p>'
            }
        }, {
            'hint_content': {
                'content_id': 'hint2',
                'html': '<p>Hello, this is html2 for state1</p>'
            }
        }]

        hint_list2 = [{
            'hint_content': {
                'content_id': 'hint1',
                'html': '<p>Hello, this is html1 for state2</p>'
            }
        }]

        state1.update_interaction_hints(hint_list1)

        state2.update_interaction_hints(hint_list2)

        exp_services.save_new_exploration(self.albert_id, exploration1)

        exploration2 = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title='title', category='category')

        exploration2.add_states(['State1', 'State2'])

        state1 = exploration2.states['State1']

        hint_list1 = [{
            'hint_content': {
                'content_id': 'hint1',
                'html': '<p>Hello, this is html1 for state1</p>'
            }
        }]

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

        hint_list = [{
            'hint_content': {
                'content_id': 'hint1',
                'html': '<p>Hello, this is html1 for state1</p>'
            }
        }, {
            'hint_content': {
                'content_id': 'hint2',
                'html': '<p>Hello, this is html2 for state1</p>'
            }
        }]

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


class TranslatorToVoiceArtistOneOffJobTests(test_utils.GenericTestBase):
    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob]

    EXP_ID = 'exp_id'

    USERNAME_A = 'usernamea'
    USERNAME_B = 'usernameb'
    EMAIL_A = 'emaila@example.com'
    EMAIL_B = 'emailb@example.com'

    def setUp(self):
        super(TranslatorToVoiceArtistOneOffJobTests, self).setUp()
        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.signup(self.EMAIL_B, self.USERNAME_B)

        self.user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        self.user_b_id = self.get_user_id_from_email(self.EMAIL_B)

    def test_action_is_performed_when_translator_ids_exists(self):
        """Test translator_ids are migrated to voice_artist_ids successfully."""
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Exploration Title 1')

        rights_manager.create_new_exploration_rights(
            exploration.id, self.user_a_id)
        exp_rights_model = exp_models.ExplorationRightsModel.get(
            exploration.id)
        exp_rights_model.translator_ids = [self.user_a_id, self.user_b_id]
        commit_message = 'Assign a translator for test'
        commit_cmds = [{
            'cmd': 'change_role',
            'assignee_id': self.user_a_id,
            'new_role': 'translator'
            }, {
                'cmd': 'change_role',
                'assignee_id': self.user_b_id,
                'new_role': 'translator'
            }]
        exp_rights_model.commit(self.user_a_id, commit_message, commit_cmds)

        exp_summary_model = exp_models.ExpSummaryModel(
            id=exploration.id,
            title='title',
            category='category',
            objective='Old objective',
            language_code='en',
            community_owned=exp_rights_model.community_owned,
            translator_ids=[self.user_a_id, self.user_b_id]
        )
        exp_summary_model.put()

        job_id = (
            exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob.create_new())
        exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob.get_output(
                job_id)
            )
        expected_output = ['[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

        exp_rights_model_2 = exp_models.ExplorationRightsModel.get(
            exploration.id)
        self.assertEqual([], exp_rights_model_2.translator_ids)
        self.assertEqual(
            [self.user_a_id, self.user_b_id],
            exp_rights_model_2.voice_artist_ids
        )

        exp_summary_model_2 = exp_models.ExpSummaryModel.get(exploration.id)
        self.assertEqual([], exp_summary_model_2.translator_ids)
        self.assertEqual(
            [self.user_a_id, self.user_b_id],
            exp_summary_model_2.voice_artist_ids
        )

    def test_partial_job_is_performed_for_deleted_exploration_summary(self):
        """Tests that when ExplorationRightsModel exists but ExpSummaryModel
        does not exist or is deleted, action is only performed for rights model,
        and returns the id of corresponding exploration.
        """
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Exploration Title 1')

        rights_manager.create_new_exploration_rights(
            exploration.id, self.user_a_id)
        exp_rights_model = exp_models.ExplorationRightsModel.get(
            exploration.id)
        exp_rights_model.translator_ids = [self.user_b_id]
        commit_message = 'Assign a translator for test'
        commit_cmds = [{
            'cmd': 'change_role',
            'assignee_ids': self.user_b_id,
            'new_role': 'translator'
        }]
        exp_rights_model.commit(self.user_a_id, commit_message, commit_cmds)

        exp_summary_model = exp_models.ExpSummaryModel(
            id=exploration.id,
            title='title',
            category='category',
            objective='Old objective',
            language_code='en',
            community_owned=exp_rights_model.community_owned,
            translator_ids=[self.user_b_id]
        )
        exp_summary_model.put()
        exp_services.delete_exploration_summaries([exploration.id])

        job_id = (
            exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob.create_new())
        exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob.get_output(
                job_id)
            )
        expected_output = ['[u\'Summary model does not exist or is '
                           'deleted\', [u\'exp_id\']]']
        self.assertEqual(actual_output, expected_output)

        exp_rights_model_2 = exp_models.ExplorationRightsModel.get(
            exploration.id)
        self.assertEqual([], exp_rights_model_2.translator_ids)
        self.assertEqual([self.user_b_id], exp_rights_model_2.voice_artist_ids)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Tests that no action is performed when an exploration is deleted."""
        exp_id = '100'
        self.save_new_valid_exploration(exp_id, self.user_a_id)
        exp_services.delete_exploration(self.user_a_id, exp_id)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob)
