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
import ast

from constants import constants
from core.domain import skill_domain
from core.domain import skill_jobs_one_off
from core.domain import skill_services
from core.platform import models
from core.tests import test_utils
import feconf

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class SkillMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    SKILL_ID = 'skill_id'

    def setUp(self):
        super(SkillMigrationOneOffJobTests, self).setUp()

        # Setup user who will own the test skills.
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.process_and_flush_pending_tasks()

    def test_migration_job_does_not_convert_up_to_date_skill(self):
        """Tests that the skill migration job does not convert a
        skill that is already the latest schema version.
        """
        # Create a new skill that should not be affected by the
        # job.
        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, description='A description')
        skill_services.save_new_skill(self.albert_id, skill)
        self.assertEqual(
            skill.skill_contents_schema_version,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            skill.misconceptions_schema_version,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)

        # Start migration job.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                skill_jobs_one_off.SkillMigrationOneOffJob.create_new())
            skill_jobs_one_off.SkillMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        # Verify the skill is exactly the same after migration.
        updated_skill = (
            skill_services.get_skill_by_id(self.SKILL_ID))
        self.assertEqual(
            updated_skill.skill_contents_schema_version,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            updated_skill.misconceptions_schema_version,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)

        output = skill_jobs_one_off.SkillMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
        expected = [[u'skill_migrated',
                     [u'1 skills successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_deleted_skill(self):
        """Tests that the skill migration job skips deleted skill
        and does not attempt to migrate.
        """
        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, description='A description')
        skill_services.save_new_skill(self.albert_id, skill)

        # Delete the skill before migration occurs.
        skill_services.delete_skill(
            self.albert_id, self.SKILL_ID)

        # Ensure the skill is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            skill_services.get_skill_by_id(self.SKILL_ID)

        # Start migration job on sample skill.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                skill_jobs_one_off.SkillMigrationOneOffJob.create_new())
            skill_jobs_one_off.SkillMigrationOneOffJob.enqueue(job_id)

            # This running without errors indicates the deleted skill is
            # being ignored.
            self.process_and_flush_pending_tasks()

        # Ensure the skill is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            skill_services.get_skill_by_id(self.SKILL_ID)

        output = skill_jobs_one_off.SkillMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
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
            'content_ids_to_audio_translations': {
                'explanation': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            }
        }
        self.save_new_skill_with_defined_schema_versions(
            self.SKILL_ID, self.albert_id, 'A description', 0,
            misconceptions=[], skill_contents=skill_contents)
        skill = (
            skill_services.get_skill_by_id(self.SKILL_ID))
        self.assertEqual(skill.misconceptions_schema_version, 1)
        self.assertEqual(skill.skill_contents_schema_version, 1)

        # Start migration job.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                skill_jobs_one_off.SkillMigrationOneOffJob.create_new())
            skill_jobs_one_off.SkillMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

            # Verify that the skill migrates correctly.
            updated_skill = (
                skill_services.get_skill_by_id(self.SKILL_ID))

        self.assertEqual(
            updated_skill.skill_contents_schema_version,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            updated_skill.misconceptions_schema_version,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)

        output = skill_jobs_one_off.SkillMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
        expected = [[u'skill_migrated',
                     [u'1 skills successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])
