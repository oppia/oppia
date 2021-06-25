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

import datetime
import logging

from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils
import feconf

(exp_models, classifier_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.classifier])


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
