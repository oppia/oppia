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

"""Tests the methods defined in skill services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import random

from constants import constants
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class SkillServicesUnitTests(test_utils.GenericTestBase):
    """Test the skill services module."""

    SKILL_ID = None
    USER_ID = 'user'
    MISCONCEPTION_ID_1 = 1
    MISCONCEPTION_ID_2 = 2

    def setUp(self):
        super(SkillServicesUnitTests, self).setUp()
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

        self.signup('a@example.com', 'A')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)
        self.signup('admin2@example.com', username='adm2')

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id_admin_2 = self.get_user_id_from_email('admin2@example.com')
        self.set_admins([self.ADMIN_USERNAME, 'adm2'])
        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)
        self.user_admin_2 = user_services.UserActionsInfo(self.user_id_admin_2)

        self.skill = self.save_new_skill(
            self.SKILL_ID, self.USER_ID, description='Description',
            misconceptions=misconceptions,
            skill_contents=skill_contents,
            prerequisite_skill_ids=['skill_id_1', 'skill_id_2'])

    def test_apply_change_list_with_invalid_property_name(self):
        class MockSkillChange(python_utils.OBJECT):
            def __init__(self, cmd, property_name):
                self.cmd = cmd
                self.property_name = property_name

        invalid_skill_change_list = [MockSkillChange(
            skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'invalid_property_name')]

        with self.assertRaisesRegexp(Exception, 'Invalid change dict.'):
            skill_services.apply_change_list(
                self.SKILL_ID, invalid_skill_change_list, self.user_id_a)

    def test_compute_summary(self):
        skill_summary = skill_services.compute_summary_of_skill(self.skill)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)
        self.assertEqual(skill_summary.worked_examples_count, 1)

    def test_get_new_skill_id(self):
        new_skill_id = skill_services.get_new_skill_id()

        self.assertEqual(len(new_skill_id), 12)
        self.assertEqual(skill_models.SkillModel.get_by_id(new_skill_id), None)

    def test_get_descriptions_of_skills(self):
        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        self.save_new_skill(
            'skill_id_1', self.user_id_admin, description='Description 1',
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
            'skill_id_2', self.user_id_admin, description='Description 2',
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

        skill_services.delete_skill(self.user_id_admin, 'skill_id_2')
        skill_descriptions, deleted_skill_ids = (
            skill_services.get_descriptions_of_skills(
                ['skill_id_1', 'skill_id_2']))
        self.assertEqual(deleted_skill_ids, ['skill_id_2'])
        self.assertEqual(
            skill_descriptions, {
                'skill_id_1': 'Description 1',
                'skill_id_2': None
            }
        )

    def test_get_rubrics_of_linked_skills(self):
        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        self.save_new_skill(
            'skill_id_1', self.user_id_admin, description='Description 1',
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
            'skill_id_2', self.user_id_admin, description='Description 2',
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

        skill_services.delete_skill(self.user_id_admin, 'skill_id_2')
        skill_rubrics, deleted_skill_ids = (
            skill_services.get_rubrics_of_skills(
                ['skill_id_1', 'skill_id_2']))
        self.assertEqual(deleted_skill_ids, ['skill_id_2'])

        self.assertEqual(
            skill_rubrics, {
                'skill_id_1': [
                    skill_domain.Rubric(
                        constants.SKILL_DIFFICULTIES[0], ['Explanation 1']
                    ).to_dict(),
                    skill_domain.Rubric(
                        constants.SKILL_DIFFICULTIES[1], ['Explanation 2']
                    ).to_dict(),
                    skill_domain.Rubric(
                        constants.SKILL_DIFFICULTIES[2], ['Explanation 3']
                    ).to_dict()],
                'skill_id_2': None
            }
        )

    def test_get_skill_from_model(self):
        skill_model = skill_models.SkillModel.get(self.SKILL_ID)
        skill = skill_services.get_skill_from_model(skill_model)

        self.assertEqual(skill.to_dict(), self.skill.to_dict())

    def test_get_skill_summary_from_model(self):
        skill_summary_model = skill_models.SkillSummaryModel.get(self.SKILL_ID)
        skill_summary = skill_services.get_skill_summary_from_model(
            skill_summary_model)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)
        self.assertEqual(skill_summary.worked_examples_count, 1)

    def test_get_all_skill_summaries(self):
        skill_summaries = skill_services.get_all_skill_summaries()

        self.assertEqual(len(skill_summaries), 1)
        self.assertEqual(skill_summaries[0].id, self.SKILL_ID)
        self.assertEqual(skill_summaries[0].description, 'Description')
        self.assertEqual(skill_summaries[0].misconception_count, 1)
        self.assertEqual(skill_summaries[0].worked_examples_count, 1)

    def test_get_skill_by_id(self):
        expected_skill = self.skill.to_dict()
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.to_dict(), expected_skill)

    def test_commit_log_entry(self):
        skill_commit_log_entry = (
            skill_models.SkillCommitLogEntryModel.get_commit(self.SKILL_ID, 1)
        )
        self.assertEqual(skill_commit_log_entry.commit_type, 'create')
        self.assertEqual(skill_commit_log_entry.skill_id, self.SKILL_ID)
        self.assertEqual(skill_commit_log_entry.user_id, self.USER_ID)

    def test_get_skill_summary_by_id(self):
        skill_summary = skill_services.get_skill_summary_by_id(self.SKILL_ID)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)

    def test_update_skill(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_ADD_SKILL_MISCONCEPTION,
                'new_misconception_dict': {
                    'id': self.skill.next_misconception_id,
                    'name': 'test name',
                    'notes': '<p>test notes</p>',
                    'feedback': '<p>test feedback</p>',
                    'must_be_addressed': True
                }
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NAME),
                'misconception_id': self.skill.next_misconception_id,
                'old_value': 'test name',
                'new_value': 'Name'
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED
                ),
                'misconception_id': self.skill.next_misconception_id,
                'old_value': True,
                'new_value': False
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_ADD_PREREQUISITE_SKILL,
                'skill_id': 'skill_id_3'
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_DELETE_PREREQUISITE_SKILL,
                'skill_id': 'skill_id_1'
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_RUBRICS,
                'difficulty': constants.SKILL_DIFFICULTIES[0],
                'explanations': [
                    '<p>New Explanation 1</p>', '<p>New Explanation 2</p>']
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_RUBRICS,
                'difficulty': constants.SKILL_DIFFICULTIES[1],
                'explanations': ['<p>Explanation</p>']
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Updated misconception name.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        skill_summary = skill_services.get_skill_summary_by_id(self.SKILL_ID)
        self.assertEqual(skill_summary.misconception_count, 2)
        self.assertEqual(skill_summary.version, 2)
        self.assertEqual(skill.version, 2)
        self.assertEqual(
            skill.prerequisite_skill_ids, ['skill_id_2', 'skill_id_3'])
        self.assertEqual(skill.misconceptions[1].name, 'Name')
        self.assertEqual(skill.misconceptions[1].must_be_addressed, False)
        self.assertEqual(
            skill.rubrics[0].explanations, [
                '<p>New Explanation 1</p>', '<p>New Explanation 2</p>'])
        self.assertEqual(skill.rubrics[1].explanations, ['<p>Explanation</p>'])

    def test_merge_skill(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID),
                'old_value': '',
                'new_value': 'TestSkillId'
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_ALL_QUESTIONS_MERGED),
                'old_value': None,
                'new_value': False
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Merging skill.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.version, 2)
        self.assertEqual(skill.superseding_skill_id, 'TestSkillId')
        self.assertEqual(skill.all_questions_merged, False)

    def test_set_merge_complete_for_skill(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID),
                'old_value': None,
                'new_value': self.SKILL_ID
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_ALL_QUESTIONS_MERGED),
                'old_value': False,
                'new_value': True
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Setting merge complete for skill.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.version, 2)
        self.assertEqual(skill.all_questions_merged, True)


    def test_get_merged_skill_ids(self):
        skill_ids = skill_services.get_merged_skill_ids()
        self.assertEqual(len(skill_ids), 0)
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID),
                'old_value': '',
                'new_value': 'TestSkillId'
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Merging skill.')
        skill_ids = skill_services.get_merged_skill_ids()
        self.assertEqual(len(skill_ids), 1)
        self.assertEqual(skill_ids[0], self.SKILL_ID)

    def test_delete_skill(self):
        skill_services.delete_skill(self.USER_ID, self.SKILL_ID)
        self.assertEqual(
            skill_services.get_skill_by_id(self.SKILL_ID, strict=False), None)
        self.assertEqual(
            skill_services.get_skill_summary_by_id(
                self.SKILL_ID, strict=False), None)

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

        skills = skill_services.get_multi_skills(['skill_a', 'skill_b'])

        self.assertEqual(len(skills), 2)

        self.assertEqual(skills[0].id, 'skill_a')
        self.assertEqual(skills[0].description, 'Description A')
        self.assertEqual(skills[0].misconceptions, [])

        self.assertEqual(skills[1].id, 'skill_b')
        self.assertEqual(skills[1].description, 'Description B')
        self.assertEqual(skills[1].misconceptions, [])

        with self.assertRaisesRegexp(
            Exception, 'No skill exists for ID skill_c'):
            skill_services.get_multi_skills(['skill_a', 'skill_c'])

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
            skill_services.get_skill_from_model(model)

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
            rubric_schema_version=1,
            skill_contents_schema_version=1,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_admin, 'skill model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d misconception schemas at '
            'present.' % feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
            skill_services.get_skill_from_model(model)

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
            misconceptions_schema_version=1,
            rubric_schema_version=0,
            skill_contents_schema_version=1,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_admin, 'skill model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d rubric schemas at '
            'present.' % feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
            skill_services.get_skill_from_model(model)

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

        skill = skill_services.get_skill_by_id(self.SKILL_ID, version=1)
        self.assertEqual(skill.id, self.SKILL_ID)
        self.assertEqual(skill.language_code, 'en')

        skill = skill_services.get_skill_by_id(self.SKILL_ID, version=2)
        self.assertEqual(skill.id, self.SKILL_ID)
        self.assertEqual(skill.language_code, 'bn')

    def test_cannot_update_skill_with_no_commit_message(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_LANGUAGE_CODE,
                'old_value': 'en',
                'new_value': 'bn'
            })
        ]

        with self.assertRaisesRegexp(
            Exception, 'Expected a commit message, received none.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist, '')

    def test_cannot_update_skill_with_empty_changelist(self):
        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save skill'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, [], 'No changes made.')

    def test_mismatch_of_skill_versions(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_LANGUAGE_CODE,
                'old_value': 'en',
                'new_value': 'bn'
            })
        ]
        skill_model = skill_models.SkillModel.get(self.SKILL_ID)
        skill_model.version = 0

        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: trying to update version 0 of skill '
            'from version 1. Please reload the page and try again.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Change language code.')

        skill_model.version = 2
        with self.assertRaisesRegexp(
            Exception,
            'Trying to update version 2 of skill from version 1, which is too '
            'old. Please reload the page and try again.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Change language code.')

    def test_normal_user_cannot_update_skill_property(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_DESCRIPTION,
                'old_value': 'Description',
                'new_value': 'New description'
            })
        ]

        with self.assertRaisesRegexp(
            Exception,
            'The user does not have enough rights to edit the '
            'skill description.'):
            skill_services.update_skill(
                self.user_id_a, self.SKILL_ID, changelist,
                'Change description.')

    def test_update_skill_explanation(self):
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        old_explanation = {'content_id': '1', 'html': '<p>Explanation</p>'}
        new_explanation = {'content_id': '1', 'html': '<p>New explanation</p>'}

        self.assertEqual(
            skill.skill_contents.explanation.to_dict(), old_explanation)

        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_CONTENTS_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_CONTENTS_PROPERTY_EXPLANATION),
                'old_value': old_explanation,
                'new_value': new_explanation
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist, 'Change explanation.')

        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(
            skill.skill_contents.explanation.to_dict(), new_explanation)

    def test_update_skill_worked_examples(self):
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        old_worked_example = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        ).to_dict()
        new_worked_example = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1 new</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1 new</p>')
        ).to_dict()

        self.assertEqual(len(skill.skill_contents.worked_examples), 1)
        self.assertEqual(
            skill.skill_contents.worked_examples[0].to_dict(),
            old_worked_example)

        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_CONTENTS_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES),
                'old_value': [old_worked_example],
                'new_value': [new_worked_example]
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist, 'Change worked examples.')

        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(len(skill.skill_contents.worked_examples), 1)
        self.assertEqual(
            skill.skill_contents.worked_examples[0].to_dict(),
            new_worked_example)

    def test_delete_skill_misconception(self):
        skill = skill_services.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(len(skill.misconceptions), 1)
        self.assertEqual(skill.misconceptions[0].id, self.MISCONCEPTION_ID_1)

        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_DELETE_SKILL_MISCONCEPTION,
                'misconception_id': self.MISCONCEPTION_ID_1,
            })
        ]

        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist, 'Delete misconception.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(skill.misconceptions, [])

    def test_update_skill_misconception_notes(self):
        skill = skill_services.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(len(skill.misconceptions), 1)
        self.assertEqual(skill.misconceptions[0].id, self.MISCONCEPTION_ID_1)
        self.assertEqual(skill.misconceptions[0].notes, '<p>description</p>')

        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NOTES),
                'misconception_id': self.MISCONCEPTION_ID_1,
                'old_value': '<p>description</p>',
                'new_value': '<p>new description</p>'
            })
        ]

        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Update misconception notes.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(len(skill.misconceptions), 1)
        self.assertEqual(skill.misconceptions[0].id, self.MISCONCEPTION_ID_1)
        self.assertEqual(
            skill.misconceptions[0].notes, '<p>new description</p>')

    def test_update_skill_misconception_feedback(self):
        skill = skill_services.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(len(skill.misconceptions), 1)
        self.assertEqual(skill.misconceptions[0].id, self.MISCONCEPTION_ID_1)
        self.assertEqual(
            skill.misconceptions[0].feedback, '<p>default_feedback</p>')

        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK),
                'misconception_id': self.MISCONCEPTION_ID_1,
                'old_value': '<p>default_feedback</p>',
                'new_value': '<p>new feedback</p>'
            })
        ]

        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Update misconception feedback.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(len(skill.misconceptions), 1)
        self.assertEqual(skill.misconceptions[0].id, self.MISCONCEPTION_ID_1)
        self.assertEqual(
            skill.misconceptions[0].feedback, '<p>new feedback</p>')

    def test_cannot_update_skill_with_invalid_change_list(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_context_manager = self.assertRaises(Exception)

        with logging_swap, assert_raises_context_manager:
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, 'invalid_change_list',
                'commit message')

        self.assertEqual(len(observed_log_messages), 1)
        self.assertRegexpMatches(
            observed_log_messages[0], 'object has no'
            ' attribute \'cmd\' %s invalid_change_list' % self.SKILL_ID)

    def test_cannot_update_misconception_name_with_invalid_id(self):
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'property_name': (
                skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NAME),
            'misconception_id': 'invalid_id',
            'old_value': 'test name',
            'new_value': 'Name'
        })]

        with self.assertRaisesRegexp(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Updated misconception name.')

    def test_cannot_update_misconception_must_be_addressed_with_invalid_id(
            self):
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'property_name': (
                skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED),
            'misconception_id': 'invalid_id',
            'old_value': False,
            'new_value': True
        })]

        with self.assertRaisesRegexp(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Updated misconception must_be_addressed.')

    def test_cannot_add_already_existing_prerequisite_skill(self):
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_ADD_PREREQUISITE_SKILL,
            'skill_id': 'skill_id_1'
        })]
        with self.assertRaisesRegexp(
            Exception, 'The skill is already a prerequisite skill.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Added prereq skill.')

    def test_cannot_delete_non_existent_prerequisite_skill(self):
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_DELETE_PREREQUISITE_SKILL,
            'skill_id': 'skill_id_5'
        })]
        with self.assertRaisesRegexp(
            Exception, 'The skill to remove is not a prerequisite skill.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Removed prereq skill.')

    def test_cannot_add_rubric_with_invalid_difficulty(self):
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_RUBRICS,
            'difficulty': 'invalid_difficulty',
            'explanations': ['<p>Explanation</p>']
        })]

        with self.assertRaisesRegexp(
            Exception, 'There is no rubric for the given difficulty.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Added rubric.')

    def test_cannot_delete_misconception_with_invalid_id(self):
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_DELETE_SKILL_MISCONCEPTION,
            'misconception_id': 'invalid_id'
        })]

        with self.assertRaisesRegexp(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist, 'Delete misconception')

    def test_cannot_update_misconception_notes_with_invalid_id(self):
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'property_name': (
                skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NOTES),
            'misconception_id': 'invalid_id',
            'old_value': 'description',
            'new_value': 'new description'
        })]

        with self.assertRaisesRegexp(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Updated misconception notes.')

    def test_cannot_update_misconception_feedback_with_invalid_id(self):
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'property_name': (
                skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK),
            'misconception_id': 'invalid_id',
            'old_value': 'default_feedback',
            'new_value': 'new feedback'
        })]

        with self.assertRaisesRegexp(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Updated misconception feedback.')


class SkillMasteryServicesUnitTests(test_utils.GenericTestBase):
    """Test the skill mastery services module."""

    SKILL_IDS = []
    USER_ID = 'user'
    DEGREE_OF_MASTERY_1 = 0.0
    DEGREE_OF_MASTERY_2 = 0.5

    def setUp(self):
        super(SkillMasteryServicesUnitTests, self).setUp()
        self.SKILL_ID_1 = skill_services.get_new_skill_id()
        self.SKILL_ID_2 = skill_services.get_new_skill_id()
        self.SKILL_ID_3 = skill_services.get_new_skill_id()
        self.SKILL_IDS = [self.SKILL_ID_1, self.SKILL_ID_2, self.SKILL_ID_3]
        skill_services.create_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_1, self.DEGREE_OF_MASTERY_1)
        skill_services.create_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_2, self.DEGREE_OF_MASTERY_2)

    def test_get_user_skill_mastery(self):
        degree_of_mastery = skill_services.get_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_1)

        self.assertEqual(degree_of_mastery, self.DEGREE_OF_MASTERY_1)

        degree_of_mastery = skill_services.get_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_3)

        self.assertEqual(degree_of_mastery, None)

    def test_get_multi_user_skill_mastery(self):
        degree_of_mastery = skill_services.get_multi_user_skill_mastery(
            self.USER_ID, self.SKILL_IDS)

        self.assertEqual(
            degree_of_mastery, {
                self.SKILL_ID_1: self.DEGREE_OF_MASTERY_1,
                self.SKILL_ID_2: self.DEGREE_OF_MASTERY_2,
                self.SKILL_ID_3: None
            })

    def test_create_multi_user_skill_mastery(self):
        skill_id_4 = skill_services.get_new_skill_id()
        skill_id_5 = skill_services.get_new_skill_id()
        skill_services.create_multi_user_skill_mastery(
            self.USER_ID, {skill_id_4: 0.3, skill_id_5: 0.5})

        degrees_of_mastery = skill_services.get_multi_user_skill_mastery(
            self.USER_ID, [skill_id_4, skill_id_5])

        self.assertEqual(
            degrees_of_mastery, {skill_id_4: 0.3, skill_id_5: 0.5})

    def test_filter_skills_by_mastery(self):
        # Create feconf.MAX_NUMBER_OF_SKILL_IDS + 3 skill_ids
        # to test two things:
        #   1. The skill_ids should be sorted.
        #   2. The filtered skill_ids should be feconf.MAX_NUMBER_OF_SKILL_IDS
        # in number.

        # List of mastery values (float values between 0.0 and 1.0)
        masteries = [self.DEGREE_OF_MASTERY_1, self.DEGREE_OF_MASTERY_2, None]

        # Creating feconf.MAX_NUMBER_OF_SKILL_IDS additional user skill
        # masteries.
        for _ in python_utils.RANGE(feconf.MAX_NUMBER_OF_SKILL_IDS):
            skill_id = skill_services.get_new_skill_id()
            mastery = random.random()
            masteries.append(mastery)
            skill_services.create_user_skill_mastery(
                self.USER_ID, skill_id, mastery)
            self.SKILL_IDS.append(skill_id)

        # Sorting the masteries, which should represent the masteries of the
        # skill_ids that are finally returned.
        masteries.sort()
        degrees_of_masteries = skill_services.get_multi_user_skill_mastery(
            self.USER_ID, self.SKILL_IDS)
        arranged_filtered_skill_ids = skill_services.filter_skills_by_mastery(
            self.USER_ID, self.SKILL_IDS)

        self.assertEqual(
            len(arranged_filtered_skill_ids), feconf.MAX_NUMBER_OF_SKILL_IDS)

        # Assert that all the returned skill_ids are a part of the first
        # feconf.MAX_NUMBER_OF_SKILL_IDS sorted skill_ids.
        for i in python_utils.RANGE(feconf.MAX_NUMBER_OF_SKILL_IDS):
            self.assertIn(
                degrees_of_masteries[arranged_filtered_skill_ids[i]],
                masteries[:feconf.MAX_NUMBER_OF_SKILL_IDS])

        # Testing the arrangement.
        excluded_skill_ids = list(set(self.SKILL_IDS) - set(
            arranged_filtered_skill_ids))
        for skill_id in excluded_skill_ids:
            self.SKILL_IDS.remove(skill_id)
        self.assertEqual(arranged_filtered_skill_ids, self.SKILL_IDS)


# TODO(lilithxxx): Remove this mock class and tests for the mock skill
# migrations once the actual functions are implemented.
# See issue: https://github.com/oppia/oppia/issues/7009.
class MockSkillObject(skill_domain.Skill):
    """Mocks Skill domain object."""

    @classmethod
    def _convert_skill_contents_v1_dict_to_v2_dict(cls, skill_contents):
        """Converts v1 skill_contents dict to v2."""
        return skill_contents


class SkillMigrationTests(test_utils.GenericTestBase):

    def test_migrate_skill_contents_to_latest_schema(self):
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        explanation_content_id = feconf.DEFAULT_SKILL_EXPLANATION_CONTENT_ID
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                explanation_content_id, feconf.DEFAULT_SKILL_EXPLANATION), [],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    explanation_content_id: {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    explanation_content_id: {}
                }
            }))
        model = skill_models.SkillModel(
            id='skill_id',
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[],
            skill_contents=skill_contents.to_dict(),
            next_misconception_id=1,
            misconceptions_schema_version=1,
            rubric_schema_version=1,
            skill_contents_schema_version=1,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'skill model created', commit_cmd_dicts)

        swap_skill_object = self.swap(skill_domain, 'Skill', MockSkillObject)
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SKILL_CONTENTS_SCHEMA_VERSION', 2)

        with swap_skill_object, current_schema_version_swap:
            skill = skill_services.get_skill_from_model(model)

        self.assertEqual(skill.skill_contents_schema_version, 2)

    def test_migrate_misconceptions_to_latest_schema(self):
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        explanation_content_id = feconf.DEFAULT_SKILL_EXPLANATION_CONTENT_ID
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                explanation_content_id, feconf.DEFAULT_SKILL_EXPLANATION), [],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    explanation_content_id: {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    explanation_content_id: {}
                }
            }))
        model = skill_models.SkillModel(
            id='skill_id',
            description='description',
            language_code='en',
            misconceptions=[{
                'id': 1,
                'name': 'name',
                'notes': 'notes',
                'feedback': 'default_feedback'
            }],
            rubrics=[],
            skill_contents=skill_contents.to_dict(),
            next_misconception_id=2,
            misconceptions_schema_version=1,
            rubric_schema_version=1,
            skill_contents_schema_version=1,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'skill model created', commit_cmd_dicts)

        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_MISCONCEPTIONS_SCHEMA_VERSION', 2)

        with current_schema_version_swap:
            skill = skill_services.get_skill_from_model(model)

        self.assertEqual(skill.misconceptions_schema_version, 2)
        self.assertEqual(skill.misconceptions[0].must_be_addressed, True)

    def test_migrate_rubrics_to_latest_schema(self):
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        explanation_content_id = feconf.DEFAULT_SKILL_EXPLANATION_CONTENT_ID
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                explanation_content_id, feconf.DEFAULT_SKILL_EXPLANATION), [],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    explanation_content_id: {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    explanation_content_id: {}
                }
            }))

        model = skill_models.SkillModel(
            id='skill_id',
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[{
                'difficulty': 'Easy',
                'explanation': 'Easy explanation'
            }, {
                'difficulty': 'Medium',
                'explanation': 'Medium explanation'
            }, {
                'difficulty': 'Hard',
                'explanation': 'Hard explanation'
            }],
            skill_contents=skill_contents.to_dict(),
            next_misconception_id=1,
            misconceptions_schema_version=1,
            rubric_schema_version=1,
            skill_contents_schema_version=1,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'skill model created', commit_cmd_dicts)

        swap_skill_object = self.swap(skill_domain, 'Skill', MockSkillObject)
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_RUBRIC_SCHEMA_VERSION', 2)

        with swap_skill_object, current_schema_version_swap:
            skill = skill_services.get_skill_from_model(model)

        self.assertEqual(skill.rubric_schema_version, 2)
        self.assertEqual(skill.rubrics[0].difficulty, 'Easy')
        self.assertEqual(skill.rubrics[0].explanations, ['Easy explanation'])
        self.assertEqual(skill.rubrics[1].difficulty, 'Medium')
        self.assertEqual(skill.rubrics[1].explanations, ['Medium explanation'])
        self.assertEqual(skill.rubrics[2].difficulty, 'Hard')
        self.assertEqual(skill.rubrics[2].explanations, ['Hard explanation'])
