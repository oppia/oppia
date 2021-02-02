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

"""Tests for fetching skill domain objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.domain import state_domain
from core.platform import models
from core.tests import test_utils
import feconf

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class SkillFetchersUnitTests(test_utils.GenericTestBase):
    """Tests for skill fetchers."""

    SKILL_ID = None
    USER_ID = 'user'
    MISCONCEPTION_ID_1 = 1

    def setUp(self):
        super(SkillFetchersUnitTests, self).setUp()
        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml('1', '<p>Explanation</p>'), [example_1],
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
        misconceptions = [skill_domain.Misconception(
            self.MISCONCEPTION_ID_1, 'name', '<p>description</p>',
            '<p>default_feedback</p>', True)]
        self.SKILL_ID = skill_services.get_new_skill_id()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.skill = self.save_new_skill(
            self.SKILL_ID, self.USER_ID, description='Description',
            misconceptions=misconceptions,
            skill_contents=skill_contents,
            prerequisite_skill_ids=['skill_id_1', 'skill_id_2'])

    def test_get_multi_skills(self):
        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        self.save_new_skill(
            'skill_a', self.user_id_admin, description='Description A',
            misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml('1', '<p>Explanation</p>'),
                [example_1],
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
        )
        self.save_new_skill(
            'skill_b', self.user_id_admin, description='Description B',
            misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml('1', '<p>Explanation</p>'),
                [example_1],
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
        )

        skills = skill_fetchers.get_multi_skills(['skill_a', 'skill_b'])

        self.assertEqual(len(skills), 2)

        self.assertEqual(skills[0].id, 'skill_a')
        self.assertEqual(skills[0].description, 'Description A')
        self.assertEqual(skills[0].misconceptions, [])

        self.assertEqual(skills[1].id, 'skill_b')
        self.assertEqual(skills[1].description, 'Description B')
        self.assertEqual(skills[1].misconceptions, [])

        with self.assertRaisesRegexp(
            Exception, 'No skill exists for ID skill_c'):
            skill_fetchers.get_multi_skills(['skill_a', 'skill_c'])

    def test_get_skill_by_id(self):
        expected_skill = self.skill.to_dict()
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.to_dict(), expected_skill)

    def test_get_skill_from_model_with_invalid_skill_contents_schema_version(
            self):
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        model = skill_models.SkillModel(
            id='skill_id',
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[],
            next_misconception_id=0,
            misconceptions_schema_version=1,
            rubric_schema_version=1,
            skill_contents_schema_version=0,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_admin, 'skill model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d skill schemas at '
            'present.' % feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
            skill_fetchers.get_skill_from_model(model)

    def test_get_skill_from_model_with_invalid_misconceptions_schema_version(
            self):
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        model = skill_models.SkillModel(
            id='skill_id',
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[],
            next_misconception_id=0,
            misconceptions_schema_version=0,
            rubric_schema_version=3,
            skill_contents_schema_version=2,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_admin, 'skill model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d misconception schemas at '
            'present.' % feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
            skill_fetchers.get_skill_from_model(model)

    def test_get_skill_from_model_with_invalid_rubric_schema_version(self):
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        model = skill_models.SkillModel(
            id='skill_id',
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[],
            next_misconception_id=0,
            misconceptions_schema_version=2,
            rubric_schema_version=0,
            skill_contents_schema_version=2,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_admin, 'skill model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d rubric schemas at '
            'present.' % feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
            skill_fetchers.get_skill_from_model(model)

    def test_get_skill_from_model_with_description(self):
        self.assertEqual(
            skill_fetchers.get_skill_by_description('Description').to_dict(),
            self.skill.to_dict()
        )
        self.assertEqual(
            skill_fetchers.get_skill_by_description('Does not exist'),
            None
        )

    def test_get_skill_by_id_with_different_versions(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_LANGUAGE_CODE,
                'old_value': 'en',
                'new_value': 'bn'
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist, 'update language code')

        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID, version=1)
        self.assertEqual(skill.id, self.SKILL_ID)
        self.assertEqual(skill.language_code, 'en')

        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID, version=2)
        self.assertEqual(skill.id, self.SKILL_ID)
        self.assertEqual(skill.language_code, 'bn')
