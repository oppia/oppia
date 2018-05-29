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

from core import jobs_registry
from core.domain import exp_domain
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(job_models, exp_models,) = models.Registry.import_models([
    models.NAMES.job, models.NAMES.exploration])
search_services = models.Registry.import_search_services()


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

    def test_all_exps_public(self):
        """Test summary batch job if all explorations are public."""
        self._run_batch_job_once_and_verify_output(
            self.EXP_SPECS,
            default_status=rights_manager.ACTIVITY_STATUS_PUBLIC)

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

            self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
            self.login(self.ADMIN_EMAIL)
            admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
            self.set_admins([self.ADMIN_USERNAME])
            admin = user_services.UserActionsInfo(admin_id)

            # Create and delete an exploration (to make sure job handles
            # deleted explorations correctly).
            exp_id = '100'
            self.save_new_valid_exploration(
                exp_id,
                admin_id,
                title=default_spec['title'],
                category=default_spec['category'])
            exploration = exp_services.get_exploration_by_id(exp_id)
            exp_services.delete_exploration(admin_id, exp_id)

            # Get dummy explorations.
            num_exps = len(exp_specs)
            expected_job_output = {}

            for ind in range(num_exps):
                exp_id = str(ind)
                spec = default_spec
                spec.update(exp_specs[ind])
                self.save_new_valid_exploration(
                    exp_id,
                    admin_id,
                    title=spec['title'],
                    category=spec['category'])
                exploration = exp_services.get_exploration_by_id(exp_id)

                # Publish exploration.
                if spec['status'] == rights_manager.ACTIVITY_STATUS_PUBLIC:
                    rights_manager.publish_exploration(admin, exp_id)

                # Do not include user_id here, so all explorations are not
                # editable for now (will be updated depending on user_id
                # in galleries).
                exp_rights_model = exp_models.ExplorationRightsModel.get(
                    exp_id)

                exploration = exp_services.get_exploration_by_id(exp_id)
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
                    exp_rights_model.translator_ids,
                    exp_rights_model.viewer_ids,
                    [admin_id],
                    {admin_id: 1},
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
                if exp_rights_model.translator_ids:
                    expected_job_output[exp_id].translator_ids = (
                        exp_rights_model.translator_ids)
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
                actual_job_output.keys(), expected_job_output.keys())

            # Note: 'exploration_model_last_updated' is not expected to be the
            # same, because it is now read from the version model representing
            # the exploration's history snapshot, and not the ExplorationModel.
            simple_props = ['id', 'title', 'category', 'objective',
                            'language_code', 'tags', 'ratings', 'status',
                            'community_owned', 'owner_ids',
                            'editor_ids', 'translator_ids', 'viewer_ids',
                            'contributor_ids', 'contributors_summary',
                            'version', 'exploration_model_created_on']
            for exp_id in actual_job_output:
                for prop in simple_props:
                    self.assertEqual(
                        getattr(actual_job_output[exp_id], prop),
                        getattr(expected_job_output[exp_id], prop))


class OneOffExplorationFirstPublishedJobTest(test_utils.GenericTestBase):

    EXP_ID = 'exp_id'

    def test_first_published_time_of_exploration_that_is_unpublished(self):
        """This tests that, if an exploration is published, unpublished, and
        then published again, the job uses the first publication time as the
        value for first_published_msec.
        """
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        owner = user_services.UserActionsInfo(owner_id)
        admin = user_services.UserActionsInfo(admin_id)

        self.save_new_valid_exploration(
            self.EXP_ID, owner_id, end_state_name='End')
        rights_manager.publish_exploration(owner, self.EXP_ID)
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

        rights_manager.unpublish_exploration(admin, self.EXP_ID)
        rights_manager.publish_exploration(owner, self.EXP_ID)
        job_id = job_class.create_new()
        exp_jobs_one_off.ExplorationFirstPublishedOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Test to see whether first_published_msec remains the same despite the
        # republication.
        exploration_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertEqual(
            exp_first_published, exploration_rights.first_published_msec)


class ExpSummariesContributorsOneOffJobTest(test_utils.GenericTestBase):

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob]

    EXP_ID = 'exp_id'

    USERNAME_A = 'usernamea'
    USERNAME_B = 'usernameb'
    EMAIL_A = 'emaila@example.com'
    EMAIL_B = 'emailb@example.com'

    def test_contributors_for_valid_contribution(self):
        """Test that if only one commit is made, that the contributor
        list consists of that contributor's user id.
        """
        self.signup(self.EMAIL_A, self.USERNAME_A)
        user_a_id = self.get_user_id_from_email(self.EMAIL_A)

        exploration = self.save_new_valid_exploration(
            self.EXP_ID, user_a_id)
        job_id = (
            exp_jobs_one_off.ExpSummariesContributorsOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        exploration_summary = exp_services.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual(
            [user_a_id], exploration_summary.contributor_ids)

    def test_repeat_contributors(self):
        """Test that if the same user makes more than one commit that changes
        the content of an exploration, the user is only represented once in the
        list of contributors for that exploration.
        """
        self.signup(self.EMAIL_A, self.USERNAME_A)
        user_a_id = self.get_user_id_from_email(self.EMAIL_A)

        # Have one user make two commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, user_a_id, title='Original Title')
        exploration_model = exp_models.ExplorationModel.get(
            self.EXP_ID, strict=True, version=None)
        exploration_model.title = 'New title'
        exploration_model.commit(
            user_a_id, 'Changed title.', [])

        # Run the job to compute the contributor ids.
        job_id = (
            exp_jobs_one_off.ExpSummariesContributorsOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify that the length of the contributor list is one, and that
        # the list contains the user who made these commits.
        exploration_summary = exp_services.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual(
            [user_a_id], exploration_summary.contributor_ids)

    def test_contributors_with_only_reverts_not_counted(self):
        """Test that contributors who have only done reverts do not
        have their user id appear in the contributor list.
        """
        # Sign up two users.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        self.signup(self.EMAIL_B, self.USERNAME_B)
        user_b_id = self.get_user_id_from_email(self.EMAIL_B)
        # Have one user make two commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, user_a_id, title='Original Title')
        change_list = [{
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'New title'
        }]
        exp_services.update_exploration(
            user_a_id, self.EXP_ID, change_list, 'Changed title.')

        # Have the second user revert version 2 to version 1.
        exp_services.revert_exploration(user_b_id, self.EXP_ID, 2, 1)

        # Run the job to compute the contributor ids.
        job_id = (
            exp_jobs_one_off.ExpSummariesContributorsOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesContributorsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify that the committer list does not contain the user
        # who only reverted.
        exploration_summary = exp_services.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual([user_a_id], exploration_summary.contributor_ids)

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
        exploration_summary = exp_services.get_exploration_summary_by_id(
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
        exploration_summary = exp_services.get_exploration_summary_by_id(
            exploration.id)
        self.assertNotIn(
            feconf.MIGRATION_BOT_USERNAME, exploration_summary.contributor_ids)


class ExplorationContributorsSummaryOneOffJobTest(test_utils.GenericTestBase):
    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob]

    EXP_ID = 'exp_id'

    USERNAME_A = 'usernamea'
    USERNAME_B = 'usernameb'
    EMAIL_A = 'emaila@example.com'
    EMAIL_B = 'emailb@example.com'

    def setUp(self):
        super(ExplorationContributorsSummaryOneOffJobTest, self).setUp()
        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.signup(self.EMAIL_B, self.USERNAME_B)

    def test_contributors_for_valid_nonrevert_contribution(self):
        """Test that if only non-revert commits are made by
        contributor then the contributions summary shows same
        exact number of commits for that contributor's ID.
        """

        user_a_id = self.get_user_id_from_email(self.EMAIL_A)

        # Let USER A make three commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, user_a_id, title='Exploration Title')

        exp_services.update_exploration(
            user_a_id, self.EXP_ID, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            }], 'Changed title.')

        exp_services.update_exploration(
            user_a_id, self.EXP_ID, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            }], 'Changed Objective.')

        # Run the job to compute contributors summary.
        job_id = exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.create_new() # pylint: disable=line-too-long
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        exploration_summary = exp_services.get_exploration_summary_by_id(
            exploration.id)

        self.assertEqual(
            3, exploration_summary.contributors_summary[user_a_id])

    def test_contributors_with_only_reverts_not_included(self):
        """Test that if only reverts are made by contributor then the
        contributions summary shouldn’t contain that contributor’s ID.
        """

        user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        user_b_id = self.get_user_id_from_email(self.EMAIL_B)

        # Let USER A make three commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, user_a_id, title='Exploration Title 1')

        exp_services.update_exploration(
            user_a_id, self.EXP_ID, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            }], 'Changed title.')
        exp_services.update_exploration(
            user_a_id, self.EXP_ID, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            }], 'Changed Objective.')

        # Let the second user revert version 3 to version 2.
        exp_services.revert_exploration(user_b_id, self.EXP_ID, 3, 2)

        # Run the job to compute the contributors summary.
        job_id = exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.create_new() # pylint: disable=line-too-long
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        exploration_summary = exp_services.get_exploration_summary_by_id(
            exploration.id)

        # Check that the contributors_summary does not contains user_b_id.
        self.assertNotIn(user_b_id, exploration_summary.contributors_summary)

        # Check that the User A has only 2 commits after user b has reverted
        # to version 2.
        self.assertEquals(2, exploration_summary.contributors_summary[user_a_id]) # pylint: disable=line-too-long

    def test_reverts_not_counted(self):
        """Test that if both non-revert commits and revert are
        made by contributor then the contributions summary shows
        only non-revert commits for that contributor. However,
        the commits made after the version to which we have reverted
        shouldn't be counted either.
        """

        user_a_id = self.get_user_id_from_email(self.EMAIL_A)

        # Let USER A make 3 non-revert commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, user_a_id, title='Exploration Title')
        exp_services.update_exploration(
            user_a_id, self.EXP_ID, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            }], 'Changed title.')
        exp_services.update_exploration(
            user_a_id, self.EXP_ID, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            }], 'Changed Objective.')

        # Let USER A revert version 3 to version 2.
        exp_services.revert_exploration(user_a_id, self.EXP_ID, 3, 2)

        # Run the job to compute the contributor summary.
        job_id = exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.create_new() # pylint: disable=line-too-long
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Check that USER A's number of contributions is equal to 2.
        exploration_summary = exp_services.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual(2, exploration_summary.contributors_summary[user_a_id])

    def test_nonhuman_committers_not_counted(self):
        """Test that only human committers are counted as contributors."""

        # Create a commit with the system user id.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, feconf.SYSTEM_COMMITTER_ID, title='Original Title')

        # Create commits with all the system user ids.
        for system_id in feconf.SYSTEM_USER_IDS:
            exp_services.update_exploration(
                system_id, self.EXP_ID, [{
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'Title changed by %s' % system_id
                }], 'Changed title.')

        # Run the job to compute the contributor summary.
        job_id = exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.create_new() # pylint: disable=line-too-long
        exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Check that no system id was added to the exploration's
        # contributor's summary.

        exploration_summary = exp_services.get_exploration_summary_by_id(
            exploration.id)

        for system_id in feconf.SYSTEM_USER_IDS:
            self.assertNotIn(
                system_id,
                exploration_summary.contributors_summary)


class ExplorationMigrationJobTest(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ExplorationMigrationJobTest, self).setUp()

        # Setup user who will own the test explorations.
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
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
        init_state.interaction.default_outcome = None
        exp_services.save_new_exploration(self.albert_id, exploration)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
        yaml_before_migration = exploration.to_yaml()

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the exploration is exactly the same after migration.
        updated_exp = exp_services.get_exploration_by_id(self.VALID_EXP_ID)
        self.assertEqual(
            updated_exp.states_schema_version,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
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
        updated_exp = exp_services.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            updated_exp.states_schema_version,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

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
            exp_services.get_exploration_by_id(self.NEW_EXP_ID)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)

        # This running without errors indicates the deleted exploration is
        # being ignored, since otherwise exp_services.get_exploration_by_id
        # (used within the job) will raise an error.
        self.process_and_flush_pending_tasks()

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_services.get_exploration_by_id(self.NEW_EXP_ID)


class ExplorationStateIdMappingJobTest(test_utils.GenericTestBase):
    """Tests for the ExplorationStateIdMapping one off job."""

    EXP_ID = 'eid'

    def setUp(self):
        """Initialize owner before each test case."""
        super(ExplorationStateIdMappingJobTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_that_mapreduce_job_works_for_first_version_of_exploration(self):
        """Tests that mapreduce job works correctly when the only first
        exploration version exists.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', False):
            exploration = self.save_new_valid_exploration(
                self.EXP_ID, self.owner_id)

        job_id = exp_jobs_one_off.ExplorationStateIdMappingJob.create_new()
        exp_jobs_one_off.ExplorationStateIdMappingJob.enqueue(job_id)

        self.process_and_flush_pending_tasks()

        expected_mapping = {
            exploration.init_state_name: 0
        }
        mapping = exp_services.get_state_id_mapping(self.EXP_ID, 1)
        self.assertEqual(mapping.exploration_id, self.EXP_ID)
        self.assertEqual(mapping.exploration_version, 1)
        self.assertEqual(mapping.largest_state_id_used, 0)
        self.assertDictEqual(mapping.state_names_to_ids, expected_mapping)

    def test_that_mapreduce_job_works(self):
        """Test that mapreduce job is working as expected."""
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', False):
            exploration = self.save_new_valid_exploration(
                self.EXP_ID, self.owner_id)

            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [{
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                }], 'Add state name')

            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [{
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state 2',
                }, {
                    'cmd': exp_domain.CMD_DELETE_STATE,
                    'state_name': 'new state'
                }], 'Modify states')

            exp_services.revert_exploration(self.owner_id, self.EXP_ID, 3, 1)

        job_id = exp_jobs_one_off.ExplorationStateIdMappingJob.create_new()
        exp_jobs_one_off.ExplorationStateIdMappingJob.enqueue(job_id)

        self.process_and_flush_pending_tasks()

        expected_mapping = {
            exploration.init_state_name: 0
        }
        mapping = exp_services.get_state_id_mapping(self.EXP_ID, 1)
        self.assertEqual(mapping.exploration_id, self.EXP_ID)
        self.assertEqual(mapping.exploration_version, 1)
        self.assertEqual(mapping.largest_state_id_used, 0)
        self.assertDictEqual(mapping.state_names_to_ids, expected_mapping)

        expected_mapping = {
            exploration.init_state_name: 0,
            'new state': 1
        }
        mapping = exp_services.get_state_id_mapping(self.EXP_ID, 2)
        self.assertEqual(mapping.exploration_id, self.EXP_ID)
        self.assertEqual(mapping.exploration_version, 2)
        self.assertEqual(mapping.largest_state_id_used, 1)
        self.assertDictEqual(mapping.state_names_to_ids, expected_mapping)

        expected_mapping = {
            exploration.init_state_name: 0,
            'new state 2': 2
        }
        mapping = exp_services.get_state_id_mapping(self.EXP_ID, 3)
        self.assertEqual(mapping.exploration_id, self.EXP_ID)
        self.assertEqual(mapping.exploration_version, 3)
        self.assertEqual(mapping.largest_state_id_used, 2)
        self.assertDictEqual(mapping.state_names_to_ids, expected_mapping)

        expected_mapping = {
            exploration.init_state_name: 0
        }
        mapping = exp_services.get_state_id_mapping(self.EXP_ID, 4)
        self.assertEqual(mapping.exploration_id, self.EXP_ID)
        self.assertEqual(mapping.exploration_version, 4)
        self.assertEqual(mapping.largest_state_id_used, 2)
        self.assertDictEqual(mapping.state_names_to_ids, expected_mapping)


class ExplorationContentValidationJobTest(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ExplorationContentValidationJobTest, self).setUp()

        # Setup user who will own the test explorations.
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.process_and_flush_pending_tasks()

    def test_for_validation_job(self):
        """Tests that the exploration validation job validates the content
        without skipping any tags.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exploration.add_states(['State1', 'State2'])
        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        content1_dict = {
            'html': '''<blockquote><div><p>Hello, this <i>is</i> state1
                </p> </div> </blockquote> <pre>I'm looking for a particular
                <b>Hello Oppia</b> message</pre>. <p> Don't you want to
                say hello? You can learn more about oppia
                <oppia-noninteractive-link url-with-value="&amp;quot;
                https://www.example.com&amp;quot;" text-with-value="&amp;quot;
                here&amp;quot;"></oppia-noninteractive-link></p>''',
            'audio_translations': {}
        }
        content2_dict = {
            'html': '''<pre>Hello, this is state2.</pre> <blockquote>
                <ol> <li>item1</li> <li>item2</li> </ol> </blockquote>.<p>
                You can see this equation <b> <oppia-noninteractive-math
                raw_latex-with-value="&amp;quot;\\frac{x}{y}&amp;
                quot;"></oppia-noninteractive-math></b></p>
                ''',
            'audio_translations': {}
        }
        state1.update_content(content1_dict)
        state2.update_content(content2_dict)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start validation job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationContentValidationJob.create_new()
        exp_jobs_one_off.ExplorationContentValidationJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationContentValidationJob.get_output(job_id))
        expected_output = [u"[u'Errors', [u'{}']]"]

        self.assertEqual(actual_output, expected_output)

        default_outcome_dict = {
            'dest': 'State2',
            'feedback': {
                'html': '''<p>Sorry, it doesn't look like your <span>program
                </span>prints any output</p>.<p> <blockquote> Could you get
                it to print something?</blockquote> You can do this by using a
                statement like print</p>. <br> You can ask any doubt if you have
                <oppia-noninteractive-link url-with-value="&amp;quot;
                https://www.example.com&amp;quot;" text-with-value="
                &amp;quot;Here&amp;quot;"></oppia-noninteractive-link>.
                ''',
                'audio_translations': {}
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None
        }

        state1.update_interaction_default_outcome(default_outcome_dict)
        exp_services.save_new_exploration(self.albert_id, exploration)

        job_id = exp_jobs_one_off.ExplorationContentValidationJob.create_new()
        exp_jobs_one_off.ExplorationContentValidationJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationContentValidationJob.get_output(job_id))
        expected_output = [u'[u\'Errors\', [u"{\'invalidTags\': [u\'span\'], u\'oppia-noninteractive-link\': [u\'[document]\'], u\'br\': [u\'[document]\']}"]]'] # pylint: disable=line-too-long

        self.assertEqual(actual_output, expected_output)
