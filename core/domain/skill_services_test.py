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

from __future__ import annotations

import logging

from core import feconf
from core.constants import constants
from core.domain import config_services
from core.domain import question_domain
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.domain import state_domain
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
from typing import Dict, Final, List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import question_models
    from mypy_imports import skill_models

(skill_models, question_models) = models.Registry.import_models([
    models.Names.SKILL, models.Names.QUESTION
])

SuggestionChangeDictType = Dict[
    str,
    Union[
        str,
        Dict[str, Union[state_domain.StateDict, int, str, List[str]]],
        float
    ]
]


class SkillServicesUnitTests(test_utils.GenericTestBase):
    """Test the skill services module."""

    USER_ID: Final = 'user'
    MISCONCEPTION_ID_1: Final = 1
    MISCONCEPTION_ID_2: Final = 2

    def setUp(self) -> None:
        super().setUp()
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
        self.num_queries_to_fetch = 10
        self.SKILL_ID = skill_services.get_new_skill_id()
        self.SKILL_ID2 = skill_services.get_new_skill_id()
        self.SKILL_ID3 = skill_services.get_new_skill_id()

        self.signup('a@example.com', 'A')
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup('admin2@example.com', 'adm2')

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))
        self.user_id_admin_2 = self.get_user_id_from_email('admin2@example.com')
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME, 'adm2'])
        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_admin = user_services.get_user_actions_info(
            self.user_id_admin)
        self.user_admin_2 = user_services.get_user_actions_info(
            self.user_id_admin_2)

        self.skill = self.save_new_skill(
            self.SKILL_ID, self.USER_ID, description='Description',
            misconceptions=misconceptions,
            skill_contents=skill_contents,
            prerequisite_skill_ids=['skill_id_1', 'skill_id_2'])

    def test_apply_change_list_with_invalid_property_name(self) -> None:
        class MockSkillChange:
            def __init__(self, cmd: str, property_name: str) -> None:
                self.cmd = cmd
                self.property_name = property_name

        invalid_skill_change_list = [MockSkillChange(
            skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'invalid_property_name')]

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(Exception, 'Invalid change dict.'):
            skill_services.apply_change_list(
                self.SKILL_ID, invalid_skill_change_list, self.user_id_a)  # type: ignore[arg-type]

    def test_compute_summary(self) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        skill_summary = skill_services.compute_summary_of_skill(skill)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)
        self.assertEqual(skill_summary.worked_examples_count, 1)

    def test_raises_error_when_the_skill_provided_with_no_created_on_data(
        self
    ) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        skill.created_on = None

        with self.assertRaisesRegex(
            Exception,
            'No data available for when the skill was created.'
        ):
            skill_services.compute_summary_of_skill(skill)

    def test_raises_error_when_the_skill_provided_with_no_last_updated_data(
        self
    ) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        skill.last_updated = None

        with self.assertRaisesRegex(
            Exception,
            'No data available for when the skill was last_updated.'
        ):
            skill_services.compute_summary_of_skill(skill)

    def test_get_image_filenames_from_skill(self) -> None:
        explanation_html = (
            'Explanation with image: <oppia-noninteractive-image '
            'filepath-with-value="&quot;img.svg&quot;" caption-with-value='
            '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>'
        )
        example_explanation_html = (
            'Explanation with image: <oppia-noninteractive-image '
            'filepath-with-value="&quot;img2.svg&quot;" caption-with-value='
            '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>'
        )
        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', example_explanation_html)
        )
        self.skill.skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml('1', explanation_html), [example_1],
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
        filenames = skill_services.get_image_filenames_from_skill(self.skill)
        self.assertItemsEqual(filenames, ['img.svg', 'img2.svg'])

    def test_get_new_skill_id(self) -> None:
        new_skill_id = skill_services.get_new_skill_id()

        self.assertEqual(len(new_skill_id), 12)
        self.assertEqual(skill_models.SkillModel.get_by_id(new_skill_id), None)

    def test_get_descriptions_of_skills(self) -> None:
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
                'skill_id_1': 'Description 1'
            }
        )

    def test_get_rubrics_of_linked_skills(self) -> None:
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

    def test_get_skill_from_model(self) -> None:
        skill_model = skill_models.SkillModel.get(self.SKILL_ID)
        skill = skill_fetchers.get_skill_from_model(skill_model)

        self.assertEqual(skill.to_dict(), self.skill.to_dict())

    def test_get_skill_summary_from_model(self) -> None:
        skill_summary_model = skill_models.SkillSummaryModel.get(self.SKILL_ID)
        skill_summary = skill_services.get_skill_summary_from_model(
            skill_summary_model)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)
        self.assertEqual(skill_summary.worked_examples_count, 1)

    def test_get_all_skill_summaries(self) -> None:
        skill_summaries = skill_services.get_all_skill_summaries()

        self.assertEqual(len(skill_summaries), 1)
        self.assertEqual(skill_summaries[0].id, self.SKILL_ID)
        self.assertEqual(skill_summaries[0].description, 'Description')
        self.assertEqual(skill_summaries[0].misconception_count, 1)
        self.assertEqual(skill_summaries[0].worked_examples_count, 1)

    def test_commit_log_entry(self) -> None:
        skill_commit_log_entry = (
            skill_models.SkillCommitLogEntryModel.get_commit(self.SKILL_ID, 1)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert skill_commit_log_entry is not None
        self.assertEqual(skill_commit_log_entry.commit_type, 'create')
        self.assertEqual(skill_commit_log_entry.skill_id, self.SKILL_ID)
        self.assertEqual(skill_commit_log_entry.user_id, self.USER_ID)

    def test_get_skill_summary_by_id(self) -> None:
        skill_summary = skill_services.get_skill_summary_by_id(self.SKILL_ID)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)

    def test_get_filtered_skill_summaries(self) -> None:
        self.save_new_skill(
            self.SKILL_ID2, self.USER_ID, description='Description2',
            prerequisite_skill_ids=['skill_id_1', 'skill_id_2'])
        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, [], None, None))
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID2)
        self.assertEqual(augmented_skill_summaries[1].id, self.SKILL_ID)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                1, None, 'english', [], None, None))

        self.assertEqual(len(augmented_skill_summaries), 0)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, [],
                'Oldest Created', None))

        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID)
        self.assertEqual(augmented_skill_summaries[1].id, self.SKILL_ID2)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, [],
                'Most Recently Updated', None))

        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID2)
        self.assertEqual(augmented_skill_summaries[1].id, self.SKILL_ID)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, [],
                'Least Recently Updated', None))

        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID)
        self.assertEqual(augmented_skill_summaries[1].id, self.SKILL_ID2)

    def test_cursor_behaves_correctly_when_fetching_skills_in_batches(
        self
    ) -> None:
        self.save_new_skill(
            self.SKILL_ID2, self.USER_ID, description='Description2',
            prerequisite_skill_ids=[])
        self.save_new_skill(
            self.SKILL_ID3, self.USER_ID, description='Description3',
            prerequisite_skill_ids=[])

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                1, None, None, [], None, None))
        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertIsInstance(next_cursor, str)
        self.assertTrue(more)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, [], None, next_cursor))
        self.assertEqual(len(augmented_skill_summaries), 1)
        self.assertIsNone(next_cursor)
        self.assertFalse(more)

    def test_filter_skills_by_status_all(self) -> None:
        self.save_new_skill(
            self.SKILL_ID2, self.USER_ID, description='Description2',
            prerequisite_skill_ids=['skill_id_1', 'skill_id_2'])

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, [],
                None, None))
        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, 'All', None, [],
                None, None))
        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

    def test_filter_skills_by_status_assigned(self) -> None:
        self.save_new_skill(
            self.SKILL_ID2, self.USER_ID, description='Description2',
            prerequisite_skill_ids=['skill_id_1', 'skill_id_2'])

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, 'Assigned', None, [], None, None))
        self.assertEqual(len(augmented_skill_summaries), 0)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='topic1',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.SKILL_ID2],
            subtopics=[], next_subtopic_id=1)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, 'Assigned', None,
                [], None, None))
        self.assertEqual(augmented_skill_summaries[0].topic_names, ['topic1'])
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID2)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

    def test_filter_skills_by_status_unassigned(self) -> None:
        self.save_new_skill(
            self.SKILL_ID2, self.USER_ID, description='Description2',
            prerequisite_skill_ids=['skill_id_1', 'skill_id_2'])

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, 'Unassigned', None, [],
                None, None))
        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

    def test_filter_skills_by_classroom_name(self) -> None:
        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, 'english', [], None, None))
        self.assertEqual(len(augmented_skill_summaries), 0)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        self.save_new_skill(
            self.SKILL_ID2, self.USER_ID, description='Description2',
            prerequisite_skill_ids=['skill_id_1', 'skill_id_2'])

        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='topic1',
            abbreviated_name='topic-two', url_fragment='topic-two',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.SKILL_ID2],
            subtopics=[], next_subtopic_id=1)

        config_services.set_property(
            self.user_id_admin, 'classroom_pages_data', [{
                'url_fragment': 'math',
                'name': 'math',
                'topic_ids': [topic_id],
                'topic_list_intro': 'Topics Covered',
                'course_details': 'Course Details'
            }]
        )

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, 'math', [],
                None, None))
        self.assertEqual(augmented_skill_summaries[0].topic_names, ['topic1'])
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID2)
        self.assertEqual(
            augmented_skill_summaries[0].classroom_names, ['math'])
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

    def test_filter_skills_by_keywords(self) -> None:
        self.save_new_skill(
            self.SKILL_ID2, self.USER_ID, description='Alpha',
            misconceptions=None,
            skill_contents=None,
            prerequisite_skill_ids=[])
        self.save_new_skill(
            self.SKILL_ID3, self.USER_ID, description='Beta',
            misconceptions=None,
            skill_contents=None,
            prerequisite_skill_ids=[])

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, [], None, None))

        self.assertEqual(len(augmented_skill_summaries), 3)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                1, None, None, ['Non_existent'],
                'Least Recently Updated', None))

        self.assertEqual(len(augmented_skill_summaries), 0)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, [], None, None))

        self.assertEqual(len(augmented_skill_summaries), 3)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, ['descr'], None, None))

        self.assertEqual(len(augmented_skill_summaries), 1)
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, ['alph'], None, None))

        self.assertEqual(len(augmented_skill_summaries), 1)
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID2)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, ['bet'], None, None))

        self.assertEqual(len(augmented_skill_summaries), 1)
        self.assertEqual(augmented_skill_summaries[0].id, self.SKILL_ID3)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, None, None, ['alp', 'bet'],
                None, None))

        self.assertEqual(len(augmented_skill_summaries), 2)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

        augmented_skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                self.num_queries_to_fetch, 'invalid_status', None,
                ['alp', 'bet'], None, None))

        self.assertEqual(len(augmented_skill_summaries), 0)
        self.assertEqual(next_cursor, None)
        self.assertFalse(more)

    def test_get_all_topic_assignments_for_skill(self) -> None:
        topic_id = topic_fetchers.get_new_topic_id()
        topic_id_1 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='Topic1',
            abbreviated_name='topic-three', url_fragment='topic-three',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.SKILL_ID],
            subtopics=[], next_subtopic_id=1)

        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [self.SKILL_ID],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'url_fragment': 'subtopic-one'
        })
        self.save_new_topic(
            topic_id_1, self.USER_ID, name='Topic2',
            abbreviated_name='topic-four', url_fragment='topic-four',
            description='Description2', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

        topic_assignments = (
            skill_services.get_all_topic_assignments_for_skill(self.SKILL_ID))
        topic_assignments = sorted(
            topic_assignments, key=lambda i: i.topic_name)
        self.assertEqual(len(topic_assignments), 2)
        self.assertEqual(topic_assignments[0].topic_name, 'Topic1')
        self.assertEqual(topic_assignments[0].topic_id, topic_id)
        self.assertEqual(topic_assignments[0].topic_version, 1)
        self.assertIsNone(topic_assignments[0].subtopic_id)

        self.assertEqual(topic_assignments[1].topic_name, 'Topic2')
        self.assertEqual(topic_assignments[1].topic_id, topic_id_1)
        self.assertEqual(topic_assignments[1].topic_version, 1)
        self.assertEqual(topic_assignments[1].subtopic_id, 1)

    def test_remove_skill_from_all_topics(self) -> None:
        topic_id = topic_fetchers.get_new_topic_id()
        topic_id_1 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='Topic1',
            abbreviated_name='topic-five', url_fragment='topic-five',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.SKILL_ID],
            subtopics=[], next_subtopic_id=1)

        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [self.SKILL_ID],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'url_fragment': 'subtopic-one'
        })
        self.save_new_topic(
            topic_id_1, self.USER_ID, name='Topic2',
            abbreviated_name='topic-six', url_fragment='topic-six',
            description='Description2', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

        skill_services.remove_skill_from_all_topics(self.USER_ID, self.SKILL_ID)
        topic_assignments_dict = (
            skill_services.get_all_topic_assignments_for_skill(self.SKILL_ID))
        self.assertEqual(len(topic_assignments_dict), 0)

    def test_successfully_replace_skill_id_in_all_topics(self) -> None:
        topic_id = topic_fetchers.get_new_topic_id()
        topic_id_1 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='Topic1',
            abbreviated_name='topic-five', url_fragment='topic-five',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.SKILL_ID],
            subtopics=[], next_subtopic_id=1)

        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [self.SKILL_ID],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'url_fragment': 'subtopic-one'
        })
        self.save_new_topic(
            topic_id_1, self.USER_ID, name='Topic2',
            abbreviated_name='topic-six', url_fragment='topic-six',
            description='Description2', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

        topic_assignments_dict = (
            skill_services.get_all_topic_assignments_for_skill('new_skill_id'))
        self.assertEqual(len(topic_assignments_dict), 0)
        skill_services.replace_skill_id_in_all_topics(
            self.USER_ID, self.SKILL_ID, 'new_skill_id')
        topic_assignments_dict = (
            skill_services.get_all_topic_assignments_for_skill('new_skill_id'))
        self.assertEqual(len(topic_assignments_dict), 2)

    def test_failure_replace_skill_id_in_all_topics(self) -> None:
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='Topic1',
            abbreviated_name='topic-five', url_fragment='topic-five',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.SKILL_ID, 'new_skill_id'],
            subtopics=[], next_subtopic_id=1)
        error_message = (
            'Found topic \'Topic1\' contains the two skills to be merged. '
            'Please unassign one of these skills from topic '
            'and retry this operation.')
        with self.assertRaisesRegex(Exception, error_message):
            skill_services.replace_skill_id_in_all_topics(
                self.USER_ID, self.SKILL_ID, 'new_skill_id')

    def test_update_skill(self) -> None:
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
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
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

    def test_merge_skill(self) -> None:
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
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.version, 2)
        self.assertEqual(skill.superseding_skill_id, 'TestSkillId')
        self.assertEqual(skill.all_questions_merged, False)

    def test_set_merge_complete_for_skill(self) -> None:
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
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.version, 2)
        self.assertEqual(skill.all_questions_merged, True)

    def test_get_merged_skill_ids(self) -> None:
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

    def test_delete_skill(self) -> None:
        skill_services.delete_skill(self.USER_ID, self.SKILL_ID)
        self.assertEqual(
            skill_fetchers.get_skill_by_id(self.SKILL_ID, strict=False), None)
        self.assertEqual(
            skill_services.get_skill_summary_by_id(
                self.SKILL_ID, strict=False), None)

    def test_delete_skill_marked_deleted(self) -> None:
        skill_models.SkillModel.delete_multi(
            [self.SKILL_ID], self.USER_ID, '', force_deletion=False)
        skill_model = skill_models.SkillModel.get_by_id(self.SKILL_ID)
        self.assertTrue(skill_model.deleted)

        skill_services.delete_skill(
            self.USER_ID, self.SKILL_ID, force_deletion=True)
        skill_model = skill_models.SkillModel.get_by_id(self.SKILL_ID)
        self.assertEqual(skill_model, None)
        self.assertEqual(
            skill_services.get_skill_summary_by_id(
                self.SKILL_ID, strict=False), None)

    def test_delete_skill_model_with_deleted_summary_model(self) -> None:
        skill_summary_model = (
            skill_models.SkillSummaryModel.get(self.SKILL_ID))
        skill_summary_model.delete()
        skill_summary_model_with_none = (
            skill_models.SkillSummaryModel.get(self.SKILL_ID, strict=False))
        self.assertIsNone(skill_summary_model_with_none)

        skill_services.delete_skill(
            self.USER_ID, self.SKILL_ID, force_deletion=True)
        skill_model = skill_models.SkillModel.get_by_id(self.SKILL_ID)
        self.assertEqual(skill_model, None)
        self.assertEqual(
            skill_services.get_skill_summary_by_id(
                self.SKILL_ID, strict=False), None)

    def test_delete_skill_model_with_linked_suggestion(self) -> None:
        suggestion_change: SuggestionChangeDictType = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
            },
            'skill_id': self.SKILL_ID,
            'skill_difficulty': 0.3
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, self.SKILL_ID, 1,
            self.user_id_a, suggestion_change, 'test description'
        )
        skill_services.delete_skill(
            self.user_id_a, self.SKILL_ID, force_deletion=True)

        skill_model = skill_models.SkillModel.get_by_id(self.SKILL_ID)
        self.assertEqual(skill_model, None)

        with self.assertRaisesRegex(
            Exception, 'The suggestion with id %s has already been accepted/'
            'rejected.' % suggestion.suggestion_id):
            suggestion_services.auto_reject_question_suggestions_for_skill_id(
                self.SKILL_ID)

    def test_cannot_update_skill_with_no_commit_message(self) -> None:
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_LANGUAGE_CODE,
                'old_value': 'en',
                'new_value': 'bn'
            })
        ]

        with self.assertRaisesRegex(
            Exception, 'Expected a commit message, received none.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist, '')

    def test_cannot_update_skill_with_empty_changelist(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save skill'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, [], 'No changes made.')

    def test_mismatch_of_skill_versions(self) -> None:
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

        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: trying to update version 0 of skill '
            'from version 1. Please reload the page and try again.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Change language code.')

        skill_model.version = 2
        with self.assertRaisesRegex(
            Exception,
            'Trying to update version 2 of skill from version 1, which is too '
            'old. Please reload the page and try again.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Change language code.')

    def test_normal_user_cannot_update_skill_property(self) -> None:
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_DESCRIPTION,
                'old_value': 'Description',
                'new_value': 'New description'
            })
        ]

        with self.assertRaisesRegex(
            Exception,
            'The user does not have enough rights to edit the '
            'skill description.'):
            skill_services.update_skill(
                self.user_id_a, self.SKILL_ID, changelist,
                'Change description.')

    def test_update_skill_property(self) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        old_description = 'Description'
        new_description = 'New description'

        self.assertEqual(
            skill.description, old_description)

        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_DESCRIPTION,
                'old_value': old_description,
                'new_value': new_description
            })
        ]
        skill_services.update_skill(
            self.user_id_admin,
            self.SKILL_ID, changelist,
            'Change description.'
            )

        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(
            skill.description, new_description)

    def test_update_skill_explanation(self) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
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

        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(
            skill.skill_contents.explanation.to_dict(), new_explanation)

    def test_update_skill_worked_examples(self) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
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

        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(len(skill.skill_contents.worked_examples), 1)
        self.assertEqual(
            skill.skill_contents.worked_examples[0].to_dict(),
            new_worked_example)

    def test_delete_skill_misconception(self) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)

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
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(skill.misconceptions, [])

    def test_does_skill_with_description_exist(self) -> None:
        self.assertEqual(
            skill_services.does_skill_with_description_exist('Description'),
            True
        )
        self.assertEqual(
            skill_services.does_skill_with_description_exist('Does not exist'),
            False
        )

    def test_update_skill_misconception_notes(self) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)

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
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(len(skill.misconceptions), 1)
        self.assertEqual(skill.misconceptions[0].id, self.MISCONCEPTION_ID_1)
        self.assertEqual(
            skill.misconceptions[0].notes, '<p>new description</p>')

    def test_update_skill_misconception_feedback(self) -> None:
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)

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
        skill = skill_fetchers.get_skill_by_id(self.SKILL_ID)

        self.assertEqual(len(skill.misconceptions), 1)
        self.assertEqual(skill.misconceptions[0].id, self.MISCONCEPTION_ID_1)
        self.assertEqual(
            skill.misconceptions[0].feedback, '<p>new feedback</p>')

    def test_skill_has_associated_questions(self) -> None:
        skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_1, 'user', description='Description 1')

        # Testing that no question is linked to a skill.
        self.assertEqual(
            skill_services.skill_has_associated_questions(skill_id_1),
            False
        )

        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', skill_id_1, 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', skill_id_1, 0.2)
            )

        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2]
        )

        self.assertEqual(
            skill_services.skill_has_associated_questions(skill_id_1),
            True
        )

    def test_update_skill_schema(self) -> None:
        orig_skill_dict = (
            skill_fetchers.get_skill_by_id(self.SKILL_ID).to_dict())

        changelist = [
            skill_domain.SkillChange({
                'cmd': (
                    skill_domain.CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION),
                'from_version': 1,
                'to_version': 2,
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist, 'Update schema.')

        new_skill_dict = skill_fetchers.get_skill_by_id(self.SKILL_ID).to_dict()

        # Check version is updated.
        self.assertEqual(new_skill_dict['version'], 2)

        # Delete version and check that the two dicts are the same.
        # Here we use MyPy ignore because MyPy doesn't allow key deletion from
        # TypedDict, thus we add an ignore.
        del orig_skill_dict['version']  # type: ignore[misc]
        # Here we use MyPy ignore because MyPy doesn't allow key deletion from
        # TypedDict, thus we add an ignore.
        del new_skill_dict['version']  # type: ignore[misc]
        self.assertEqual(orig_skill_dict, new_skill_dict)

    def test_cannot_update_skill_with_invalid_change_list(self) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_context_manager = self.assertRaisesRegex(
            Exception, '\'str\' object has no attribute \'cmd\'')

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with logging_swap, assert_raises_context_manager:
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, 'invalid_change_list',  # type: ignore[arg-type]
                'commit message')

        self.assertEqual(len(observed_log_messages), 1)
        self.assertRegex(
            observed_log_messages[0], 'object has no'
            ' attribute \'cmd\' %s invalid_change_list' % self.SKILL_ID)

    def test_cannot_update_misconception_name_with_invalid_id(self) -> None:
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'property_name': (
                skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NAME),
            'misconception_id': 0,
            'old_value': 'test name',
            'new_value': 'Name'
        })]

        with self.assertRaisesRegex(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Updated misconception name.')

    def test_cannot_update_misconception_must_be_addressed_with_invalid_id(
        self
    ) -> None:
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'property_name': (
                skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED),
            'misconception_id': 0,
            'old_value': False,
            'new_value': True
        })]

        with self.assertRaisesRegex(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Updated misconception must_be_addressed.')

    def test_cannot_add_already_existing_prerequisite_skill(self) -> None:
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_ADD_PREREQUISITE_SKILL,
            'skill_id': 'skill_id_1'
        })]
        with self.assertRaisesRegex(
            Exception, 'The skill is already a prerequisite skill.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Added prereq skill.')

    def test_cannot_delete_non_existent_prerequisite_skill(self) -> None:
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_DELETE_PREREQUISITE_SKILL,
            'skill_id': 'skill_id_5'
        })]
        with self.assertRaisesRegex(
            Exception, 'The skill to remove is not a prerequisite skill.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Removed prereq skill.')

    def test_cannot_add_rubric_with_invalid_difficulty(self) -> None:
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_RUBRICS,
            'difficulty': 'invalid_difficulty',
            'explanations': ['<p>Explanation</p>']
        })]

        with self.assertRaisesRegex(
            Exception, 'There is no rubric for the given difficulty.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Added rubric.')

    def test_cannot_delete_misconception_with_invalid_id(self) -> None:
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_DELETE_SKILL_MISCONCEPTION,
            'misconception_id': 0
        })]

        with self.assertRaisesRegex(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist, 'Delete misconception')

    def test_cannot_update_misconception_notes_with_invalid_id(self) -> None:
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'property_name': (
                skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NOTES),
            'misconception_id': 0,
            'old_value': 'description',
            'new_value': 'new description'
        })]

        with self.assertRaisesRegex(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Updated misconception notes.')

    def test_cannot_update_misconception_feedback_with_invalid_id(self) -> None:
        changelist = [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
            'property_name': (
                skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK),
            'misconception_id': 0,
            'old_value': 'default_feedback',
            'new_value': 'new feedback'
        })]

        with self.assertRaisesRegex(
            Exception, 'There is no misconception with the given id.'):
            skill_services.update_skill(
                self.USER_ID, self.SKILL_ID, changelist,
                'Updated misconception feedback.')

    def test_get_untriaged_skill_summaries(self) -> None:
        skill_summaries = skill_services.get_all_skill_summaries()
        skill_ids_assigned_to_some_topic = (
            topic_fetchers.get_all_skill_ids_assigned_to_some_topic())
        merged_skill_ids = skill_services.get_merged_skill_ids()

        untriaged_skill_summaries = (
            skill_services.get_untriaged_skill_summaries(
                skill_summaries, skill_ids_assigned_to_some_topic,
                merged_skill_ids))

        untriaged_skill_summary_dicts = [
            skill_summary.to_dict()
            for skill_summary in untriaged_skill_summaries]

        skill_summary = skill_services.get_skill_summary_by_id(self.SKILL_ID)
        skill_summary_dict = skill_summary.to_dict()
        expected_untriaged_skill_summary_dicts = [skill_summary_dict]

        self.assertEqual(
            untriaged_skill_summary_dicts,
            expected_untriaged_skill_summary_dicts)

    def test_get_categorized_skill_ids_and_descriptions(self) -> None:
        topic_id = topic_fetchers.get_new_topic_id()
        linked_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            linked_skill_id, self.user_id_admin, description='Description 3')
        subtopic_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            subtopic_skill_id, self.user_id_admin,
            description='Subtopic Skill')

        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title', 'url-frag')
        subtopic.skill_ids = [subtopic_skill_id]

        self.save_new_topic(
            topic_id, self.user_id_admin, name='Topic Name',
            abbreviated_name='topic', url_fragment='topic-name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[linked_skill_id],
            subtopics=[subtopic], next_subtopic_id=2)

        expected_categorized_skills_dict = {
            'Topic Name': {
                'uncategorized': [{
                    'skill_id': linked_skill_id,
                    'skill_description': 'Description 3',
                }],
                'Subtopic Title': [{
                    'skill_id': subtopic_skill_id,
                    'skill_description': 'Subtopic Skill'
                }]
            }
        }
        categorized_skills = (
            skill_services.get_categorized_skill_ids_and_descriptions())

        self.assertEqual(
            categorized_skills.to_dict(),
            expected_categorized_skills_dict)

    def test_get_topic_names_with_given_skill_in_diagnostic_test(self) -> None:
        """Checks whether a skill is assigned for the diagnostic test in
        any of the existing topics.
        """
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        topic = topic_domain.Topic.create_default_topic(
            'topic_id', 'topic', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(owner_id, topic)

        self.assertEqual(
            skill_services.get_topic_names_with_given_skill_in_diagnostic_test(
                'skill_id_1'), ['topic'])
        self.assertEqual(
            skill_services.get_topic_names_with_given_skill_in_diagnostic_test(
                'incorrect_skill_id'), [])


class SkillMasteryServicesUnitTests(test_utils.GenericTestBase):
    """Test the skill mastery services module."""

    USER_ID: Final = 'user'
    DEGREE_OF_MASTERY_1: Final = 0.0
    DEGREE_OF_MASTERY_2: Final = 0.5

    def setUp(self) -> None:
        super().setUp()
        self.SKILL_ID_1 = skill_services.get_new_skill_id()
        self.SKILL_ID_2 = skill_services.get_new_skill_id()
        self.SKILL_ID_3 = skill_services.get_new_skill_id()
        self.SKILL_IDS = [self.SKILL_ID_1, self.SKILL_ID_2, self.SKILL_ID_3]
        skill_services.create_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_1, self.DEGREE_OF_MASTERY_1)
        skill_services.create_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_2, self.DEGREE_OF_MASTERY_2)

    def test_get_user_skill_mastery(self) -> None:
        degree_of_mastery = skill_services.get_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_1)

        self.assertEqual(degree_of_mastery, self.DEGREE_OF_MASTERY_1)

        degree_of_mastery = skill_services.get_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_3)

        self.assertEqual(degree_of_mastery, None)

    def test_get_multi_user_skill_mastery(self) -> None:
        degree_of_mastery = skill_services.get_multi_user_skill_mastery(
            self.USER_ID, self.SKILL_IDS)

        self.assertEqual(
            degree_of_mastery, {
                self.SKILL_ID_1: self.DEGREE_OF_MASTERY_1,
                self.SKILL_ID_2: self.DEGREE_OF_MASTERY_2,
                self.SKILL_ID_3: None
            })

    def test_create_multi_user_skill_mastery(self) -> None:
        skill_id_4 = skill_services.get_new_skill_id()
        skill_id_5 = skill_services.get_new_skill_id()
        skill_services.create_multi_user_skill_mastery(
            self.USER_ID, {skill_id_4: 0.3, skill_id_5: 0.5})

        degrees_of_mastery = skill_services.get_multi_user_skill_mastery(
            self.USER_ID, [skill_id_4, skill_id_5])

        self.assertEqual(
            degrees_of_mastery, {skill_id_4: 0.3, skill_id_5: 0.5})

    def test_get_sorted_skill_ids(self) -> None:
        degrees_of_masteries = skill_services.get_multi_user_skill_mastery(
            self.USER_ID, self.SKILL_IDS)
        with self.swap(feconf, 'MAX_NUMBER_OF_SKILL_IDS', 2):
            sorted_skill_ids = skill_services.get_sorted_skill_ids(
                degrees_of_masteries)
        expected_sorted_skill_ids = [self.SKILL_ID_3, self.SKILL_ID_1]
        self.assertEqual(len(sorted_skill_ids), 2)
        self.assertEqual(sorted_skill_ids, expected_sorted_skill_ids)

        with self.swap(feconf, 'MAX_NUMBER_OF_SKILL_IDS', 3):
            sorted_skill_ids = skill_services.get_sorted_skill_ids(
                degrees_of_masteries)
        expected_sorted_skill_ids = [
            self.SKILL_ID_3, self.SKILL_ID_1, self.SKILL_ID_2]
        self.assertEqual(sorted_skill_ids, expected_sorted_skill_ids)

    def test_filter_skills_by_mastery(self) -> None:
        with self.swap(feconf, 'MAX_NUMBER_OF_SKILL_IDS', 2):
            arranged_filtered_skill_ids = (
                skill_services.filter_skills_by_mastery(
                    self.USER_ID, self.SKILL_IDS))
        self.assertEqual(len(arranged_filtered_skill_ids), 2)
        expected_skill_ids = [self.SKILL_ID_1, self.SKILL_ID_3]
        self.assertEqual(arranged_filtered_skill_ids, expected_skill_ids)

        with self.swap(feconf, 'MAX_NUMBER_OF_SKILL_IDS', len(self.SKILL_IDS)):
            arranged_filtered_skill_ids = (
                skill_services.filter_skills_by_mastery(
                    self.USER_ID, self.SKILL_IDS))
        self.assertEqual(arranged_filtered_skill_ids, self.SKILL_IDS)

    def test_get_multi_users_skills_mastery(self) -> None:
        user_ids = [self.USER_ID, 'user_2']
        skill_ids = [self.SKILL_ID_1, self.SKILL_ID_2]
        degrees_of_mastery = {
            self.USER_ID: {
                self.SKILL_ID_1: self.DEGREE_OF_MASTERY_1,
                self.SKILL_ID_2: self.DEGREE_OF_MASTERY_2
            },
            'user_2': {
                self.SKILL_ID_1: None,
                self.SKILL_ID_2: None
            }
        }
        user_skill_mastery = skill_services.get_multi_users_skills_mastery(
            user_ids, skill_ids)
        self.assertEqual(user_skill_mastery, degrees_of_mastery)


class SkillMigrationTests(test_utils.GenericTestBase):

    def test_migrate_skill_contents_to_latest_schema(self) -> None:
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        explanation_content_id = feconf.DEFAULT_SKILL_EXPLANATION_CONTENT_ID

        html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;image.svg&amp;quot;}">'
            '</oppia-noninteractive-math>')

        written_translations_dict_math: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                }
            }
        }
        worked_example_dict_math: skill_domain.WorkedExampleDict = {
            'question': {
                'content_id': 'question1',
                'html': html_content
            },
            'explanation': {
                'content_id': 'explanation1',
                'html': html_content
            }
        }

        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                explanation_content_id, ''),
            [skill_domain.WorkedExample.from_dict(worked_example_dict_math)],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    explanation_content_id: {}
                }
            }),
            state_domain.WrittenTranslations.from_dict(
                written_translations_dict_math))
        skill_contents_dict = skill_contents.to_dict()
        skill_contents_dict['explanation']['html'] = html_content
        skill_contents_dict['written_translations']['translations_mapping'][
            'content1']['en']['translation'] = html_content
        skill_contents_dict['worked_examples'][0]['question']['html'] = (
            html_content)
        skill_contents_dict['worked_examples'][0]['explanation']['html'] = (
            html_content)

        model = skill_models.SkillModel(
            id='skill_id',
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[],
            skill_contents=skill_contents_dict,
            next_misconception_id=1,
            misconceptions_schema_version=1,
            rubric_schema_version=1,
            skill_contents_schema_version=1,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'skill model created', commit_cmd_dicts)

        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SKILL_CONTENTS_SCHEMA_VERSION', 4)

        with current_schema_version_swap:
            skill = skill_fetchers.get_skill_from_model(model)

        self.assertEqual(skill.skill_contents_schema_version, 4)

        self.assertEqual(
            skill.skill_contents.explanation.html, html_content)
        self.assertEqual(
            skill.skill_contents.written_translations.to_dict(),
            written_translations_dict_math)
        self.assertEqual(
            skill.skill_contents.worked_examples[0].to_dict(),
            worked_example_dict_math)

    def test_migrate_misconceptions_to_latest_schema(self) -> None:
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        explanation_content_id = feconf.DEFAULT_SKILL_EXPLANATION_CONTENT_ID

        html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;image.svg&amp;quot;}">'
            '</oppia-noninteractive-math>')

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
                'notes': html_content,
                'feedback': html_content
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
            feconf, 'CURRENT_MISCONCEPTIONS_SCHEMA_VERSION', 5)

        with current_schema_version_swap:
            skill = skill_fetchers.get_skill_from_model(model)

        self.assertEqual(skill.misconceptions_schema_version, 5)
        self.assertEqual(skill.misconceptions[0].must_be_addressed, True)
        self.assertEqual(skill.misconceptions[0].notes, html_content)
        self.assertEqual(
            skill.misconceptions[0].feedback, html_content)

    def test_migrate_rubrics_to_latest_schema(self) -> None:
        commit_cmd = skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })
        explanation_content_id = feconf.DEFAULT_SKILL_EXPLANATION_CONTENT_ID
        html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;image.svg&amp;quot;}">'
            '</oppia-noninteractive-math>')
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
                'explanations': ['Easy explanation']
            }, {
                'difficulty': 'Medium',
                'explanations': ['Medium explanation']
            }, {
                'difficulty': 'Hard',
                'explanations': ['Hard explanation', html_content]
            }],
            skill_contents=skill_contents.to_dict(),
            next_misconception_id=1,
            misconceptions_schema_version=1,
            rubric_schema_version=2,
            skill_contents_schema_version=2,
            all_questions_merged=False
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'skill model created', commit_cmd_dicts)

        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_RUBRIC_SCHEMA_VERSION', 5)

        with current_schema_version_swap:
            skill = skill_fetchers.get_skill_from_model(model)

        self.assertEqual(skill.rubric_schema_version, 5)
        self.assertEqual(skill.rubrics[0].difficulty, 'Easy')
        self.assertEqual(skill.rubrics[0].explanations, ['Easy explanation'])
        self.assertEqual(skill.rubrics[1].difficulty, 'Medium')
        self.assertEqual(skill.rubrics[1].explanations, ['Medium explanation'])
        self.assertEqual(skill.rubrics[2].difficulty, 'Hard')
        self.assertEqual(
            skill.rubrics[2].explanations,
            ['Hard explanation', html_content])
