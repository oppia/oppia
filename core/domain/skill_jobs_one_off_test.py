# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Skill-related one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from constants import constants
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_jobs_one_off
from core.domain import skill_services
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils
import feconf

(base_models, skill_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.skill])


class SkillMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    SKILL_ID = 'skill_id'

    def setUp(self):
        super(SkillMigrationOneOffJobTests, self).setUp()

        # Setup user who will own the test skills.
        self.rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_migration_job_does_not_convert_up_to_date_skill(self):
        """Tests that the skill migration job does not convert a
        skill that is already the latest schema version.
        """
        # Create a new skill that should not be affected by the
        # job.
        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, 'A description', self.rubrics)
        skill_services.save_new_skill(self.albert_id, skill)
        self.assertEqual(
            skill.skill_contents_schema_version,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            skill.misconceptions_schema_version,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)
        self.assertEqual(
            skill.rubric_schema_version,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION)

        # Start migration job.
        job_id = (
            skill_jobs_one_off.SkillMigrationOneOffJob.create_new())
        skill_jobs_one_off.SkillMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        # Verify the skill is exactly the same after migration.
        updated_skill = (
            skill_fetchers.get_skill_by_id(self.SKILL_ID))
        self.assertEqual(
            updated_skill.skill_contents_schema_version,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            updated_skill.misconceptions_schema_version,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)
        self.assertEqual(
            updated_skill.rubric_schema_version,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION)

        output = skill_jobs_one_off.SkillMigrationOneOffJob.get_output(job_id)
        expected = [[u'skill_migrated',
                     [u'1 skills successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_deleted_skill(self):
        """Tests that the skill migration job skips deleted skill
        and does not attempt to migrate.
        """
        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, 'A description', self.rubrics)
        skill_services.save_new_skill(self.albert_id, skill)

        # Delete the skill before migration occurs.
        skill_services.delete_skill(
            self.albert_id, self.SKILL_ID)

        # Ensure the skill is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            skill_fetchers.get_skill_by_id(self.SKILL_ID)

        # Start migration job on sample skill.
        job_id = (
            skill_jobs_one_off.SkillMigrationOneOffJob.create_new())
        skill_jobs_one_off.SkillMigrationOneOffJob.enqueue(job_id)

        # This running without errors indicates the deleted skill is
        # being ignored.
        self.process_and_flush_pending_mapreduce_tasks()

        # Ensure the skill is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            skill_fetchers.get_skill_by_id(self.SKILL_ID)

        output = skill_jobs_one_off.SkillMigrationOneOffJob.get_output(job_id)
        expected = [[u'skill_deleted',
                     [u'Encountered 1 deleted skills.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_converts_old_skill(self):
        """Tests that the schema conversion functions work
        correctly and an old skill is converted to new
        version.
        """

        # Generate skill with old(v1) misconceptions schema
        # version and old(v1) skill contents schema version.
        skill_contents = {
            'worked_examples': [],
            'explanation': {
                'content_id': 'explanation',
                'html': feconf.DEFAULT_SKILL_EXPLANATION
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'explanation': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            }
        }
        rubrics = [{
            'difficulty': 'Easy',
            'explanation': 'easy explanation'
        }, {
            'difficulty': 'Medium',
            'explanation': 'medium explanation'
        }, {
            'difficulty': 'Hard',
            'explanation': 'hard explanation'
        }]
        self.save_new_skill_with_defined_schema_versions(
            self.SKILL_ID, self.albert_id, 'A description', 0,
            misconceptions=[], rubrics=rubrics, skill_contents=skill_contents,
            misconceptions_schema_version=1, skill_contents_schema_version=1,
            rubric_schema_version=1)

        # Start migration job.
        job_id = (
            skill_jobs_one_off.SkillMigrationOneOffJob.create_new())
        skill_jobs_one_off.SkillMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        # Verify that the skill migrates correctly.
        updated_skill = (
            skill_fetchers.get_skill_by_id(self.SKILL_ID))

        self.assertEqual(
            updated_skill.skill_contents_schema_version,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            updated_skill.misconceptions_schema_version,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)
        self.assertEqual(
            updated_skill.rubric_schema_version,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION)

        output = skill_jobs_one_off.SkillMigrationOneOffJob.get_output(job_id)
        expected = [[u'skill_migrated',
                     [u'1 skills successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_updated_skill_failing_validation(self):
        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, 'A description', self.rubrics)
        skill_services.save_new_skill(self.albert_id, skill)
        skill.description = ''

        def _mock_get_skill_by_id(unused_skill_id):
            """Mocks get_skill_by_id()."""
            return skill

        get_skill_by_id_swap = self.swap(
            skill_fetchers, 'get_skill_by_id', _mock_get_skill_by_id)

        with get_skill_by_id_swap:
            job_id = (
                skill_jobs_one_off.SkillMigrationOneOffJob.create_new())
            skill_jobs_one_off.SkillMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_mapreduce_tasks()

        output = skill_jobs_one_off.SkillMigrationOneOffJob.get_output(
            job_id)

        # If the skill had been successfully migrated, this would include a
        # 'successfully migrated' message. Its absence means that the skill
        # could not be processed.
        expected = [['validation_error',
                     ['Skill %s failed validation: Description '
                      'field should not be empty' % (self.SKILL_ID)]]]
        self.assertEqual(
            expected, [ast.literal_eval(x) for x in output])


class SkillCommitCmdMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    SKILL_ID = 'skill_id'

    default_commit_cmd0 = [{'cmd': 'create_new'}]
    default_commit_cmd1 = [{
        'difficulty': 'Easy',
        'cmd': 'update_rubrics',
        'explanations': ['New explanation']
    }, {
        'cmd': 'update_skill_property',
        'new_value': 'Test description',
        'old_value': '',
        'property_name': 'description'
    }]
    invalid_commit_cmd = [{
        'difficulty': 'Easy',
        'cmd': 'update_rubrics',
        'explanation': ['New explanation']
    }, {
        'cmd': 'update_skill_property',
        'new_value': 'Test description',
        'old_value': '',
        'property_name': 'description'
    }]

    def setUp(self):
        super(SkillCommitCmdMigrationOneOffJobTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.set_admins([self.ALBERT_NAME])

        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]

        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, 'A description', rubrics)
        skill_services.save_new_skill(self.albert_id, skill)

        skill_services.update_skill(
            self.albert_id, 'skill_id', [skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_RUBRICS,
                'difficulty': constants.SKILL_DIFFICULTIES[0],
                'explanations': ['New explanation'],
            }), skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': 'description',
                'old_value': '',
                'new_value': 'Test description'
            })], 'Changes.')

        self.commit_model_instance_0 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-skill_id-1'))
        self.commit_model_instance_1 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-skill_id-2'))

        self.metadata_model_instance_0 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                'skill_id-1'))
        self.metadata_model_instance_1 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                'skill_id-2'))

        self.process_and_flush_pending_mapreduce_tasks()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_class = skill_jobs_one_off.SkillCommitCmdMigrationOneOffJob
        job_id = job_class.create_new()
        job_class.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = job_class.get_output(job_id)
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_standard_operation(self):
        self.assertEqual(
            self.commit_model_instance_0.commit_cmds, self.default_commit_cmd0)
        self.assertEqual(
            self.commit_model_instance_1.commit_cmds,
            self.default_commit_cmd1)
        self.assertEqual(
            self.metadata_model_instance_0.commit_cmds,
            self.default_commit_cmd0)
        self.assertEqual(
            self.metadata_model_instance_1.commit_cmds,
            self.default_commit_cmd1)

        output = self._run_one_off_job()
        self.assertEqual(output, [])
        self.assertEqual(
            self.commit_model_instance_0.commit_cmds, self.default_commit_cmd0)
        self.assertEqual(
            self.commit_model_instance_1.commit_cmds, self.default_commit_cmd1)
        self.assertEqual(
            self.metadata_model_instance_0.commit_cmds,
            self.default_commit_cmd0)
        self.assertEqual(
            self.metadata_model_instance_1.commit_cmds,
            self.default_commit_cmd1)

    def test_migration_job_skips_deleted_model(self):
        self.commit_model_instance_1.commit_cmds = self.invalid_commit_cmd
        self.commit_model_instance_1.deleted = True
        self.commit_model_instance_1.update_timestamps()
        self.commit_model_instance_1.put()

        self.metadata_model_instance_1.commit_cmds = self.invalid_commit_cmd
        self.metadata_model_instance_1.deleted = True
        self.metadata_model_instance_1.update_timestamps()
        self.metadata_model_instance_1.put()
        output = self._run_one_off_job()

        self.assertEqual(output, [])

    def test_migration_job_updates_invalid_command_of_commit_model(self):
        self.commit_model_instance_1.commit_cmds = self.invalid_commit_cmd
        self.commit_model_instance_1.update_timestamps()
        self.commit_model_instance_1.put()

        self.assertEqual(
            self.commit_model_instance_0.commit_cmds,
            self.default_commit_cmd0)
        self.assertEqual(
            self.commit_model_instance_1.commit_cmds, self.invalid_commit_cmd)

        output = self._run_one_off_job()
        expected_output = [
            [
                'Commit Commands Updated-SkillCommitLogEntryModel',
                ['skill-skill_id-2']
            ]
        ]

        self.assertItemsEqual(output, expected_output)
        self.assertEqual(
            self.commit_model_instance_0.commit_cmds, self.default_commit_cmd0)
        self.commit_model_instance_1 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-skill_id-2'))
        self.assertEqual(
            self.commit_model_instance_1.commit_cmds,
            self.default_commit_cmd1)

    def test_migration_job_updates_invalid_command_of_metadata_model(self):
        self.metadata_model_instance_1.commit_cmds = self.invalid_commit_cmd
        self.metadata_model_instance_1.update_timestamps()
        self.metadata_model_instance_1.put()

        self.assertEqual(
            self.metadata_model_instance_0.commit_cmds,
            self.default_commit_cmd0)
        self.assertEqual(
            self.metadata_model_instance_1.commit_cmds,
            self.invalid_commit_cmd)

        output = self._run_one_off_job()
        expected_output = [
            [
                'Commit Commands Updated-SkillSnapshotMetadataModel',
                ['skill_id-2']
            ]
        ]

        self.assertItemsEqual(output, expected_output)
        self.assertEqual(
            self.metadata_model_instance_0.commit_cmds,
            self.default_commit_cmd0)
        self.metadata_model_instance_1 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                'skill_id-2'))
        self.assertEqual(
            self.metadata_model_instance_1.commit_cmds,
            self.default_commit_cmd1)


class MissingSkillMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    SKILL_ID = 'skill_id'

    def setUp(self):
        super(MissingSkillMigrationOneOffJobTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.set_admins([self.ALBERT_NAME])

        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]

        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, 'A description', rubrics)
        skill_services.save_new_skill(self.albert_id, skill)

        self.commit_model_instance = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-skill_id-1'))
        self.metadata_model_instance = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                'skill_id-1'))
        self.content_model_instance = (
            skill_models.SkillSnapshotContentModel.get_by_id(
                'skill_id-1'))

        self.process_and_flush_pending_mapreduce_tasks()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            skill_jobs_one_off
            .MissingSkillMigrationOneOffJob.create_new())
        skill_jobs_one_off.MissingSkillMigrationOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            skill_jobs_one_off.MissingSkillMigrationOneOffJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_standard_operation(self):
        job_id = (
            skill_jobs_one_off.MissingSkillMigrationOneOffJob.create_new())
        skill_jobs_one_off.MissingSkillMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = skill_jobs_one_off.MissingSkillMigrationOneOffJob.get_output(
            job_id)
        self.assertEqual(output, [])
        self.assertFalse(self.commit_model_instance.deleted)

    def test_migration_job_skips_deleted_model(self):
        model_instances = [
            self.commit_model_instance,
            self.metadata_model_instance,
            self.content_model_instance]
        for model in model_instances:
            model.deleted = True
            model.update_timestamps()
            model.put()

        output = self._run_one_off_job()
        self.assertEqual(output, [])

    def test_migration_job_removes_sub_models_if_skill_model_is_missing(
            self):
        skill = skill_models.SkillModel.get_by_id(self.SKILL_ID)
        skill.deleted = True
        skill.update_timestamps(update_last_updated_time=False)
        base_models.BaseModel.put_multi([skill])

        output = self._run_one_off_job()
        expected_output = [
            [
                'Skill Commit Model deleted-SkillCommitLogEntryModel',
                ['skill-skill_id-1']
            ],
            [
                'Skill Commit Model deleted-SkillSnapshotContentModel',
                ['skill_id-1']
            ],
            [
                'Skill Commit Model deleted-' +
                'SkillSnapshotMetadataModel',
                ['skill_id-1']
            ]
        ]
        self.commit_model_instance = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-skill_id-1'))
        self.metadata_model_instance = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                'skill_id-1'))
        self.content_model_instance = (
            skill_models.SkillSnapshotContentModel.get_by_id(
                'skill_id-1'))

        self.assertItemsEqual(output, expected_output)
        self.assertIsNone(self.commit_model_instance)
        self.assertIsNone(self.metadata_model_instance)
        self.assertIsNone(self.content_model_instance)
