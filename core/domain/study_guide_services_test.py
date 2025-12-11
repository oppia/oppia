# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for study guide domain objects."""

from __future__ import annotations

import re

from core.constants import constants
from core.domain import (
    skill_services,
    study_guide_domain,
    study_guide_services,
    topic_domain,
    topic_fetchers,
    topic_services,
)
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, subtopic_models

(base_models, subtopic_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.SUBTOPIC]
)


class StudyGuideServicesUnitTests(test_utils.GenericTestBase):
    """Tests for study guide services."""

    user_id = 'user_id'
    story_id_1 = 'story_1'
    story_id_2 = 'story_2'
    story_id_3 = 'story_3'
    subtopic_id = 1
    skill_id_1 = 'skill_1'
    skill_id_2 = 'skill_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.TOPIC_ID = topic_fetchers.get_new_topic_id()

        # Create a study guide.
        self.study_guide = study_guide_domain.StudyGuide.create_study_guide(
            self.subtopic_id, self.TOPIC_ID, 'heading', 'content'
        )
        study_guide_services.save_study_guide(
            self.user_id,
            self.study_guide,
            'Added study guide',
            [
                study_guide_domain.StudyGuideChange(
                    {
                        'cmd': study_guide_domain.CMD_CREATE_NEW,
                        'topic_id': self.TOPIC_ID,
                        'subtopic_id': self.subtopic_id,
                    }
                )
            ],
        )
        self.study_guide_id = study_guide_domain.StudyGuide.get_study_guide_id(
            self.TOPIC_ID, self.subtopic_id
        )

        self.TOPIC_ID_1 = topic_fetchers.get_new_topic_id()
        # Set up topic and subtopic.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'Place Values', 'abbrev', 'description', 'fragm'
        )
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1,
                'Naming Numbers',
                ['skill_id_1'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'dummy-subtopic-url',
            ),
            topic_domain.Subtopic(
                2,
                'Subtopic Name',
                ['skill_id_2'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'other-subtopic-url',
            ),
        ]
        topic.next_subtopic_id = 3
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, topic)

        # Publish the topic and its stories.
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

    def test_get_study_guide_from_model(self) -> None:
        current_study_guide = (study_guide_services.get_study_guide_by_id)(
            self.TOPIC_ID, self.subtopic_id
        )
        study_guide_model = subtopic_models.StudyGuideModel.get(
            self.study_guide_id
        )
        study_guide = study_guide_services.get_study_guide_from_model(
            study_guide_model
        )
        self.assertEqual(study_guide.to_dict(), current_study_guide.to_dict())

    def test_get_study_guide_by_id(self) -> None:
        study_guide_1 = study_guide_services.get_study_guide_by_id(
            self.TOPIC_ID, self.subtopic_id
        )
        self.assertEqual(study_guide_1.version, 1)
        self.assertEqual(study_guide_1.topic_id, self.TOPIC_ID)
        self.assertEqual(
            study_guide_1.get_subtopic_id_from_study_guide_id(),
            self.subtopic_id,
        )

        # When the study guide with the given subtopic id and topic id
        # doesn't exist.
        study_guide_2 = study_guide_services.get_study_guide_by_id(
            'topic_id', 1, strict=False
        )
        self.assertEqual(study_guide_2, None)

    def test_get_study_guide_by_id_with_version(self) -> None:
        # Test getting study guide with specific version.
        study_guide = study_guide_services.get_study_guide_by_id(
            self.TOPIC_ID, self.subtopic_id, version=1
        )
        self.assertEqual(study_guide.version, 1)

        # Test getting study guide with non-existent version.
        study_guide_none = study_guide_services.get_study_guide_by_id(
            self.TOPIC_ID, self.subtopic_id, version=999, strict=False
        )
        self.assertIsNone(study_guide_none)

    def test_get_study_guides_with_ids(self) -> None:
        subtopic_ids = [self.subtopic_id]
        study_guides = study_guide_services.get_study_guides_with_ids(
            self.TOPIC_ID, subtopic_ids
        )
        # Ruling out the possibility of None for mypy type checking.
        assert study_guides[0] is not None
        current_study_guide = (study_guide_services.get_study_guide_by_id)(
            self.TOPIC_ID, self.subtopic_id
        )
        self.assertEqual(
            study_guides[0].to_dict(), current_study_guide.to_dict()
        )

        subtopic_ids = [2]
        study_guides = study_guide_services.get_study_guides_with_ids(
            self.TOPIC_ID, subtopic_ids
        )
        self.assertEqual(study_guides, [None])

        subtopic_ids = [self.subtopic_id, 2]
        study_guides = study_guide_services.get_study_guides_with_ids(
            self.TOPIC_ID, subtopic_ids
        )
        expected_study_guides = [current_study_guide.to_dict(), None]
        # Ruling out the possibility of None for mypy type checking.
        assert study_guides[0] is not None
        self.assertEqual(
            [study_guides[0].to_dict(), study_guides[1]], expected_study_guides
        )

        subtopic_ids = []
        study_guides = study_guide_services.get_study_guides_with_ids(
            self.TOPIC_ID, subtopic_ids
        )
        self.assertEqual(study_guides, [])

        subtopic_ids = [2, 2]
        study_guides = study_guide_services.get_study_guides_with_ids(
            self.TOPIC_ID, subtopic_ids
        )
        self.assertEqual(study_guides, [None, None])

    def test_get_study_guide_sections_by_id(self) -> None:
        current_study_guide = (study_guide_services.get_study_guide_by_id)(
            self.TOPIC_ID, self.subtopic_id
        )
        sections = study_guide_services.get_study_guide_sections_by_id(
            self.TOPIC_ID, self.subtopic_id
        )
        expected_sections_dicts = [
            section.to_dict() for section in (current_study_guide.sections)
        ]
        actual_sections_dicts = [section.to_dict() for section in sections]
        self.assertEqual(expected_sections_dicts, actual_sections_dicts)

        # When the study guide doesn't exist.
        sections_none = study_guide_services.get_study_guide_sections_by_id(
            'nonexistent_topic', 999, strict=False
        )
        self.assertIsNone(sections_none)

    def test_save_study_guide(self) -> None:
        study_guide_1 = study_guide_domain.StudyGuide.create_study_guide(
            1, 'topic_id_1', 'heading', 'content'
        )
        study_guide_services.save_study_guide(
            self.user_id,
            study_guide_1,
            'Added study guide',
            [
                study_guide_domain.StudyGuideChange(
                    {
                        'cmd': study_guide_domain.CMD_CREATE_NEW,
                        'topic_id': 'topic_id_1',
                        'subtopic_id': 1,
                    }
                )
            ],
        )

        # Test saving with empty change list should raise exception.
        with self.assertRaisesRegex(
            Exception, 'Unexpected error: received an invalid change list *'
        ):
            study_guide_services.save_study_guide(
                self.user_id, study_guide_1, 'Added study guide', []
            )

        study_guide_id_1 = study_guide_domain.StudyGuide.get_study_guide_id(
            'topic_id_1', 1
        )
        study_guide_model_1 = subtopic_models.StudyGuideModel.get(
            study_guide_id_1
        )

        # Test version conflict - trying to update newer version from older.
        study_guide_1.version = 2
        study_guide_model_1.version = 3
        with self.assertRaisesRegex(
            Exception, 'Please reload the page and try again.*'
        ):
            study_guide_services.save_study_guide(
                self.user_id,
                study_guide_1,
                'Added study guide',
                [
                    study_guide_domain.StudyGuideChange(
                        {
                            'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
                            'property_name': 'sections_heading',
                            'new_value': 'new_heading',
                            'old_value': 'sections_heading_0',
                            'subtopic_id': self.subtopic_id,
                        }
                    )
                ],
            )

        # Test version conflict - trying to update older version from newer.
        study_guide_1.version = 3
        study_guide_model_1.version = 2
        with self.assertRaisesRegex(
            Exception, 'Unexpected error: trying to update version *'
        ):
            study_guide_services.save_study_guide(
                self.user_id,
                study_guide_1,
                'Added study guide',
                [
                    study_guide_domain.StudyGuideChange(
                        {
                            'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
                            'property_name': 'sections_heading',
                            'new_value': 'new_heading',
                            'old_value': 'sections_heading_0',
                            'subtopic_id': self.subtopic_id,
                        }
                    )
                ],
            )

    def test_delete_study_guide(self) -> None:
        study_guide_id = study_guide_domain.StudyGuide.get_study_guide_id(
            self.TOPIC_ID, self.subtopic_id
        )
        study_guide_services.delete_study_guide(
            self.user_id, self.TOPIC_ID, self.subtopic_id
        )

        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            re.escape(
                'Entity for class StudyGuideModel with id %s not found'
                % (study_guide_id)
            ),
        ):
            subtopic_models.StudyGuideModel.get(study_guide_id)

        # Test deleting non-existent study guide.
        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            re.escape(
                'Entity for class StudyGuideModel with id %s not found'
                % (study_guide_id)
            ),
        ):
            study_guide_services.delete_study_guide(
                self.user_id, self.TOPIC_ID, self.subtopic_id
            )

    def test_delete_study_guide_with_force_deletion(self) -> None:
        # Create a new study guide for force deletion test.
        study_guide_temp = study_guide_domain.StudyGuide.create_study_guide(
            2, 'temp_topic', 'heading', 'content'
        )
        study_guide_services.save_study_guide(
            self.user_id,
            study_guide_temp,
            'Added temp study guide',
            [
                study_guide_domain.StudyGuideChange(
                    {
                        'cmd': study_guide_domain.CMD_CREATE_NEW,
                        'topic_id': 'temp_topic',
                        'subtopic_id': 2,
                    }
                )
            ],
        )

        study_guide_services.delete_study_guide(
            self.user_id, 'temp_topic', 2, force_deletion=True
        )

        study_guide_id = study_guide_domain.StudyGuide.get_study_guide_id(
            'temp_topic', 2
        )
        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            re.escape(
                'Entity for class StudyGuideModel with id %s not found'
                % (study_guide_id)
            ),
        ):
            subtopic_models.StudyGuideModel.get(study_guide_id)

    def test_get_topic_ids_from_study_guide_ids(self) -> None:
        topic_ids = study_guide_services.get_topic_ids_from_study_guide_ids(
            ['topic1:subtopic1', 'topic2:subtopic2', 'topic1:subtopic3']
        )
        self.assertEqual(topic_ids, ['topic1', 'topic2'])

    def test_get_multi_users_study_guides_progress(self) -> None:
        degree_of_mastery = 0.5
        learner_id_1 = 'learner_1'
        learner_id_2 = 'learner_2'

        # Add some skill mastery for the learner.
        skill_services.create_user_skill_mastery(
            learner_id_1, 'skill_id_1', degree_of_mastery
        )

        study_guide_id = '{}:{}'.format(self.TOPIC_ID_1, 1)
        progress = study_guide_services.get_multi_users_study_guides_progress(
            [learner_id_1, learner_id_2], [study_guide_id]
        )

        learner_1_progress = progress[learner_id_1]
        learner_2_progress = progress[learner_id_2]

        self.assertEqual(len(learner_1_progress), 1)
        self.assertEqual(len(learner_2_progress), 1)
        self.assertEqual(learner_1_progress[0]['subtopic_id'], 1)
        self.assertEqual(
            learner_1_progress[0]['subtopic_title'], 'Naming Numbers'
        )
        self.assertEqual(
            learner_1_progress[0]['parent_topic_id'], self.TOPIC_ID_1
        )
        self.assertEqual(
            learner_1_progress[0]['parent_topic_name'], 'Place Values'
        )
        self.assertEqual(
            learner_1_progress[0]['subtopic_mastery'], degree_of_mastery
        )
        self.assertIsNone(learner_2_progress[0]['subtopic_mastery'])

    def test_get_learner_group_syllabus_study_guide_summaries(self) -> None:
        study_guide_id = '{}:{}'.format(self.TOPIC_ID_1, 1)
        expected_summaries = [
            {
                'subtopic_id': 1,
                'subtopic_title': 'Naming Numbers',
                'parent_topic_id': self.TOPIC_ID_1,
                'parent_topic_name': 'Place Values',
                'thumbnail_filename': 'image.svg',
                'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                    'subtopic'
                ][0],
                'subtopic_mastery': None,
                'parent_topic_url_fragment': 'abbrev',
                'classroom_url_fragment': None,
            }
        ]
        summaries = study_guide_services.get_learner_group_syllabus_study_guide_summaries(
            [study_guide_id]
        )
        self.assertEqual(summaries, expected_summaries)

    def test_populate_study_guide_model_fields(self) -> None:
        model = subtopic_models.StudyGuideModel(
            id=self.study_guide_id,
            topic_id=self.TOPIC_ID,
            sections=[],
            sections_schema_version=1,
            language_code='en',
            next_content_id_index=0,
        )
        study_guide = study_guide_services.get_study_guide_by_id(
            self.TOPIC_ID, self.subtopic_id
        )
        populated_model = (
            study_guide_services.populate_study_guide_model_fields(
                model, study_guide
            )
        )

        self.assertEqual(populated_model.topic_id, study_guide.topic_id)
        expected_sections = []
        for section in study_guide.sections:
            expected_sections.append(section.to_dict())
        self.assertEqual(populated_model.sections, expected_sections)
        self.assertEqual(
            populated_model.sections_schema_version,
            study_guide.sections_schema_version,
        )
        self.assertEqual(
            populated_model.language_code, study_guide.language_code
        )

    def test_get_multi_users_study_guides_progress_with_multiple_skills(
        self,
    ) -> None:
        """Test progress calculation with multiple skills per subtopic."""
        learner_id = 'test_learner'

        # Create skill masteries for both skills in the subtopic.
        skill_services.create_user_skill_mastery(learner_id, 'skill_id_1', 0.8)
        skill_services.create_user_skill_mastery(learner_id, 'skill_id_2', 0.6)

        # Second subtopic has skill_id_2.
        study_guide_id = '{}:{}'.format(self.TOPIC_ID_1, 2)
        progress = (study_guide_services.get_multi_users_study_guides_progress)(
            [learner_id], [study_guide_id]
        )

        learner_progress = progress[learner_id]
        self.assertEqual(len(learner_progress), 1)
        # Average of 0.6 (only skill_id_2 is in subtopic 2)
        self.assertEqual(learner_progress[0]['subtopic_mastery'], 0.6)

    def test_get_multi_users_study_guides_progress_no_skills(self) -> None:
        """Test progress calculation when user has no skill masteries."""
        learner_id = 'test_learner_no_skills'

        study_guide_id = '{}:{}'.format(self.TOPIC_ID_1, 1)
        progress = study_guide_services.get_multi_users_study_guides_progress(
            [learner_id], [study_guide_id]
        )

        learner_progress = progress[learner_id]
        self.assertEqual(len(learner_progress), 1)
        self.assertIsNone(learner_progress[0]['subtopic_mastery'])

    def test_get_learner_group_syllabus_study_guide_summaries_multiple_topics(
        self,
    ) -> None:
        """Test getting summaries for study guides from multiple topics."""
        # Create another topic.
        topic_id_2 = topic_fetchers.get_new_topic_id()
        topic_2 = topic_domain.Topic.create_default_topic(
            topic_id_2, 'Another Topic', 'another', 'description', 'frag2'
        )
        topic_2.thumbnail_filename = 'thumbnail.svg'
        topic_2.thumbnail_bg_color = '#C6DCDA'
        topic_2.subtopics = [
            topic_domain.Subtopic(
                1,
                'Another Subtopic',
                ['skill_id_3'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'another-subtopic-url',
            )
        ]
        topic_2.next_subtopic_id = 2
        topic_2.skill_ids_for_diagnostic_test = ['skill_id_3']
        topic_services.save_new_topic(self.admin_id, topic_2)
        topic_services.publish_topic(topic_id_2, self.admin_id)

        study_guide_ids = [
            '{}:{}'.format(self.TOPIC_ID_1, 1),
            '{}:{}'.format(topic_id_2, 1),
        ]
        summaries = study_guide_services.get_learner_group_syllabus_study_guide_summaries(
            study_guide_ids
        )

        self.assertEqual(len(summaries), 2)
        # Verify both topics are represented.
        topic_names = [summary['parent_topic_name'] for summary in summaries]
        self.assertIn('Place Values', topic_names)
        self.assertIn('Another Topic', topic_names)

    def test_commit_log_entry(self) -> None:
        """Test that commit log entries are created properly."""
        study_guide_commit_log_entry = (
            subtopic_models.StudyGuideCommitLogEntryModel.get_commit(
                self.study_guide_id, 1
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert study_guide_commit_log_entry is not None
        self.assertEqual(study_guide_commit_log_entry.commit_type, 'create')
        self.assertEqual(
            study_guide_commit_log_entry.study_guide_id, self.study_guide_id
        )
        self.assertEqual(study_guide_commit_log_entry.user_id, self.user_id)

    def test_get_study_guide_sections_by_id_with_strict_mode(self) -> None:
        """Test getting study guide sections with strict mode
        enabled/disabled.
        """
        # Test with strict=True (default) - should not raise exception
        # for existing guide.
        sections = study_guide_services.get_study_guide_sections_by_id(
            self.TOPIC_ID, self.subtopic_id, strict=True
        )
        self.assertIsNotNone(sections)

        # Test with strict=False for non-existent guide.
        sections_none = study_guide_services.get_study_guide_sections_by_id(
            'nonexistent', 999, strict=False
        )
        self.assertIsNone(sections_none)

    def test_does_study_guide_model_exist_returns_true_for_existing_guide(
        self,
    ) -> None:
        """Test that the function returns True for an
        existing study guide.
        """
        result = study_guide_services.does_study_guide_model_exist(
            self.TOPIC_ID, self.subtopic_id
        )
        self.assertTrue(result)

    def test_does_study_guide_model_exist_returns_false_for_nonexistent_guide(
        self,
    ) -> None:
        """Test that the function returns False for a non-existent
        study guide.
        """
        result = study_guide_services.does_study_guide_model_exist(
            'nonexistent_topic_id', 999
        )
        self.assertFalse(result)

    def test_generate_study_guide_models(self) -> None:
        topic_id_1 = 'topic_id_1'
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one'
        )
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_subtopic(1, self.admin_id, topic_id_1)
        topic_1 = self.save_new_topic(
            topic_id_1,
            self.admin_id,
            name='Topic 1',
            abbreviated_name='T1',
            url_fragment='url-frag-one',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic_1],
            next_subtopic_id=2,
        )
        existence = study_guide_services.does_study_guide_model_exist(
            topic_id_1, 1
        )
        self.assertFalse(existence)
        study_guide_services.generate_study_guide_models(
            topic_id_1, topic_1.subtopics
        )
        existence = study_guide_services.does_study_guide_model_exist(
            topic_id_1, 1
        )
        self.assertTrue(existence)

    def test_delete_study_guide_models(self) -> None:
        topic_id_1 = 'topic_id_1'
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one'
        )
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_subtopic(1, self.admin_id, topic_id_1)
        self.save_new_study_guide(1, self.admin_id, topic_id_1)
        topic_1 = self.save_new_topic(
            topic_id_1,
            self.admin_id,
            name='Topic 1',
            abbreviated_name='T1',
            url_fragment='url-frag-one',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic_1],
            next_subtopic_id=2,
        )
        existence = study_guide_services.does_study_guide_model_exist(
            topic_id_1, 1
        )
        self.assertTrue(existence)
        study_guide_services.delete_study_guide_models(
            topic_id_1, topic_1.subtopics
        )
        existence = study_guide_services.does_study_guide_model_exist(
            topic_id_1, 1
        )
        self.assertFalse(existence)

    def test_verify_study_guide_models_for_valid_model(self) -> None:
        topic_id_1 = 'topic_id_1'
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one'
        )
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_study_guide(1, self.admin_id, topic_id_1)
        topic_1 = self.save_new_topic(
            topic_id_1,
            self.admin_id,
            name='Topic 1',
            abbreviated_name='T1',
            url_fragment='url-frag-one',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic_1],
            next_subtopic_id=2,
        )
        issues = study_guide_services.verify_study_guide_models(
            topic_id_1, topic_1.subtopics
        )
        self.assertEqual(issues, [])

    def test_verify_study_guide_models_for_invalid_model(self) -> None:
        topic_id_1 = 'topic_id_1'
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one'
        )
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        study_guide = self.save_new_study_guide(1, self.admin_id, topic_id_1)
        study_guide_changes = [
            study_guide_domain.StudyGuideChange(
                {
                    'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
                    'subtopic_id': 1,
                    'property_name': 'sections',
                    'new_value': [
                        {
                            'heading': {
                                'content_id': 'section_heading_0',
                                'unicode_str': 'hello',
                            },
                            'content': {
                                'content_id': 'section_content_1',
                                'html': 'How are ya?',
                            },
                        }
                    ],
                    'old_value': [
                        {
                            'heading': {
                                'content_id': 'section_heading_0',
                                'unicode_str': 'Android Study Guide',
                            },
                            'content': {
                                'content_id': 'section_content_1',
                                'html': '<p>Android Study Guide Content</p>',
                            },
                        }
                    ],
                }
            )
        ]
        study_guide_services.save_study_guide(
            self.admin_id,
            study_guide,
            'Updated study guide',
            study_guide_changes,
        )
        study_guide_id = study_guide_domain.StudyGuide.get_study_guide_id(
            topic_id_1, 1
        )

        # Making the study guide model invalid by deleting the required
        # snapshot models.
        subtopic_models.StudyGuideSnapshotContentModel.get(
            '%s-1' % study_guide_id
        ).delete()
        subtopic_models.StudyGuideSnapshotMetadataModel.get(
            '%s-1' % study_guide_id
        ).delete()
        subtopic_models.StudyGuideCommitLogEntryModel.get(
            'studyguide-%s-1' % study_guide_id
        ).delete()
        topic_1 = self.save_new_topic(
            topic_id_1,
            self.admin_id,
            name='Topic 1',
            abbreviated_name='T1',
            url_fragment='url-frag-one',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic_1],
            next_subtopic_id=2,
        )
        issues = study_guide_services.verify_study_guide_models(
            topic_id_1, topic_1.subtopics
        )
        expected_issues = [
            'Missing snapshot content models: topic_id_1-1-1',
            'Missing snapshot metadata models: topic_id_1-1-1',
            'Missing commit log entry models: studyguide-topic_id_1-1-1',
        ]
        self.assertEqual(issues, expected_issues)
