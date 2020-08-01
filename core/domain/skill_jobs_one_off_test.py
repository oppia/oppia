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
from core.domain import state_domain
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
        self.rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

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
        self.process_and_flush_pending_tasks()

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
        self.process_and_flush_pending_tasks()

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
        self.process_and_flush_pending_tasks()

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

        def _mock_get_skill_by_id(unused_skill_id):
            """Mocks get_skill_by_id()."""
            return 'invalid_skill'

        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, 'A description', self.rubrics)
        skill_services.save_new_skill(self.albert_id, skill)

        get_skill_by_id_swap = self.swap(
            skill_fetchers, 'get_skill_by_id', _mock_get_skill_by_id)

        with get_skill_by_id_swap:
            job_id = (
                skill_jobs_one_off.SkillMigrationOneOffJob.create_new())
            skill_jobs_one_off.SkillMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        output = skill_jobs_one_off.SkillMigrationOneOffJob.get_output(
            job_id)

        # If the skill had been successfully migrated, this would include a
        # 'successfully migrated' message. Its absence means that the skill
        # could not be processed.
        expected = [[u'validation_error',
                     [u'Skill %s failed validation: \'unicode\' object has '
                      'no attribute \'validate\'' % (self.SKILL_ID)]]]
        self.assertEqual(
            expected, [ast.literal_eval(x) for x in output])



class SkillMathRteAuditOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    SKILL_ID = 'skill_id'

    def setUp(self):
        super(SkillMathRteAuditOneOffJobTests, self).setUp()

        # Setup user who will own the test skills.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()


    def test_job_when_skills_have_math_rich_text_components(self):
        valid_html_1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
        )
        valid_html_2 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
        )
        valid_html_3 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;-,-,-,-&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
        )

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', valid_html_1),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents1 = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )
        misconceptions1 = [skill_domain.Misconception(
            0, 'name', valid_html_1,
            valid_html_2, True)]
        rubrics1 = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], [valid_html_1]),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['<p>Explanation 2</p>']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], [valid_html_3])]
        skill1 = skill_domain.Skill(
            'skill_id1', 'Description', misconceptions1, rubrics1,
            skill_contents1, feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION, 'en', 0, 1,
            None, False, ['skill_id_2']
        )
        skill_services.save_new_skill(self.albert_id, skill1)
        job_id = (
            skill_jobs_one_off.SkillMathRteAuditOneOffJob.create_new())
        skill_jobs_one_off.SkillMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        output = skill_jobs_one_off.SkillMathRteAuditOneOffJob.get_output(
            job_id)

        overall_result = ast.literal_eval(output[0])
        expected_overall_result = {
            'total_number_skills_requiring_svgs': 1,
            'total_number_of_latex_strings_without_svg': 3
        }

        self.assertEqual(overall_result[1], expected_overall_result)
        detailed_result = ast.literal_eval(output[1])
        expected_question1_info = {
            'skill_id': 'skill_id1',
            'latex_strings_without_svg_in_skill': [
                '+,+,+,+', '-,-,-,-',
                '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)']
        }
        stories_latex_info = sorted(detailed_result[1])
        self.assertEqual(stories_latex_info[0], expected_question1_info)

    def test_job_when_skills_do_not_have_math_rich_text_components(self):
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['<p>Explanation 1</p>']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['<p>Explanation 2</p>']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['<p>Explanation 3</p>'])]

        skill = skill_domain.Skill.create_default_skill(
            'valid_skill', 'A description', rubrics)
        skill_services.save_new_skill(self.albert_id, skill)
        job_id = (
            skill_jobs_one_off.SkillMathRteAuditOneOffJob.create_new())
        skill_jobs_one_off.SkillMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        output = skill_jobs_one_off.SkillMathRteAuditOneOffJob.get_output(
            job_id)
        self.assertEqual(output, [])
