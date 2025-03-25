# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for GetClassroomsWithInvalidTopicIdJob."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import classroom_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type, Dict, List

MYPY = False
if MYPY:
    from mypy_imports import classroom_models
    from mypy_imports import topic_models

(classroom_models,) = models.Registry.import_models([models.Names.CLASSROOM])
(topic_models,) = models.Registry.import_models([models.Names.TOPIC])


class GetClassroomsWithInvalidTopicIdTests(job_test_utils.JobTestBase):
    JOB_CLASS: Type[
        classroom_validation_jobs.GetClassroomsWithInvalidTopicIdJob
    ] = classroom_validation_jobs.GetClassroomsWithInvalidTopicIdJob

    TOPIC_ID_1: Final = 'topic_1'
    TOPIC_ID_2: Final = 'topic_2'
    TOPIC_ID_3: Final = 'topic_3'

    def test_empty_storage(self) -> None:
        """Test job behavior with no classrooms or topics."""
        self.assert_job_output_is_empty()

    def test_classroom_with_valid_topic_ids(self) -> None:
        """Test classroom with all valid topic IDs."""
        # Create valid topics
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name='topic_1',
            canonical_name='canonical_name',
            abbreviated_name='abbrev',
            url_fragment='url-fragment',
            description='description',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=(
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            next_subtopic_id=1,
            language_code='en',
            page_title_fragment_for_web='fragm',
            skill_ids_for_diagnostic_test=[],
            deleted=False)
        
        topic_model2 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_2,
            name='topic_1',
            canonical_name='canonical_name',
            abbreviated_name='abbrev',
            url_fragment='url-fragment',
            description='description',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=(
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            next_subtopic_id=1,
            language_code='en',
            page_title_fragment_for_web='fragm',
            skill_ids_for_diagnostic_test=[],
            deleted=False)
        
        # Create a classroom with valid topic IDs
        classroom_topic_ids: Dict[str, List[str]] = {
            self.TOPIC_ID_1: [
                self.TOPIC_ID_2
            ]
        }
        classroom = self.create_model(
            classroom_models.ClassroomModel,
            name='classroom',
            url_fragment='/classroom',
            course_details='course details',
            teaser_text='teaser text',
            topic_list_intro='topic list intro',
            topic_id_to_prerequisite_topic_ids=classroom_topic_ids
        )
        
        self.put_multi([topic_model, topic_model2, classroom])

        self.assert_job_output_is_empty()

    def test_classroom_with_invalid_topic_ids(self) -> None:
        """Test classroom with some invalid topic IDs."""
        # Create only one valid topic
        topic = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name='topic_1',
            canonical_name='canonical_name',
            abbreviated_name='abbrev',
            url_fragment='url-fragment',
            description='description',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=(
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            next_subtopic_id=1,
            language_code='en',
            page_title_fragment_for_web='fragm',
            skill_ids_for_diagnostic_test=[],
            deleted=False)
        
        # Create a classroom with invalid topic IDs
        classroom_topic_ids: Dict[str, List[str]] = {
            self.TOPIC_ID_3: [
                self.TOPIC_ID_1,
                self.TOPIC_ID_2
            ]
        }
        classroom = self.create_model(
            classroom_models.ClassroomModel,
            name='classroom',
            url_fragment='/classroom',
            course_details='course details',
            teaser_text='teaser text',
            topic_list_intro='topic list intro',
            topic_id_to_prerequisite_topic_ids=classroom_topic_ids
        )
        
        self.put_multi([topic, classroom])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr="Classroom has invalid topic ids: \"{'topic_3': ['topic_1', 'topic_2']}\""),
            job_run_result.JobRunResult(
                stdout='CountClassroomsWithInvalidTopicIds SUCCESS: 1'),
        ])

    def test_classroom_with_all_invalid_topic_ids(self) -> None:
        """Test classroom with all invalid topic IDs."""
        # Create a classroom with no valid topics
        classroom_topic_ids: Dict[str, str] = {
            'math': self.TOPIC_ID_1,
            'science': self.TOPIC_ID_2,
            'history': self.TOPIC_ID_3
        }
        classroom = self.create_model(
            classroom_models.ClassroomModel,
            name='classroom',
            url_fragment='/classroom',
            course_details='course details',
            teaser_text='teaser text',
            topic_list_intro='topic list intro',
            topic_id_to_prerequisite_topic_ids=classroom_topic_ids
        )
        
        self.put_multi([classroom])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr="Classroom has invalid topic ids: \"{'math': 'topic_1', 'science': 'topic_2', 'history': 'topic_3'}\""),
            job_run_result.JobRunResult(
                stdout='CountClassroomsWithInvalidTopicIds SUCCESS: 1'),
        ])

    def test_multiple_classrooms_with_mixed_validity(self) -> None:
        """Test multiple classrooms with mixed topic ID validity."""
        # Create some valid topics
        topic1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name='topic_1',
            canonical_name='canonical_name',
            abbreviated_name='abbrev',
            url_fragment='url-fragment',
            description='description',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=(
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            next_subtopic_id=1,
            language_code='en',
            page_title_fragment_for_web='fragm',
            skill_ids_for_diagnostic_test=[],
            deleted=False)
        
        # Create classrooms with different topic ID validities
        classroom1_topic_ids: Dict[str, List[str]] = {
            self.TOPIC_ID_3: [
                self.TOPIC_ID_1,
                self.TOPIC_ID_2
            ]
        }
        classroom1 = self.create_model(
            classroom_models.ClassroomModel,
            name='classroom',
            url_fragment='/classroom',
            course_details='course details',
            teaser_text='teaser text',
            topic_list_intro='topic list intro',
            topic_id_to_prerequisite_topic_ids=classroom1_topic_ids
        )
        
        classroom2_topic_ids: Dict[str, List[str]] = {
            self.TOPIC_ID_3: [
                self.TOPIC_ID_1,
                self.TOPIC_ID_2
            ]
        }
        classroom2 = self.create_model(
            classroom_models.ClassroomModel,
            name='classroom2',
            url_fragment='/classroom-2',
            course_details='course details 2',
            teaser_text='teaser text 2',
            topic_list_intro='topic list intro 2',
            topic_id_to_prerequisite_topic_ids=classroom2_topic_ids
        )
        
        self.put_multi([topic1, classroom1, classroom2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr="Classroom has invalid topic ids: \"{'topic_3': ['topic_1', 'topic_2']}\""),
            job_run_result.JobRunResult(
                stderr="Classroom has invalid topic ids: \"{'topic_3': ['topic_1', 'topic_2']}\""),
            job_run_result.JobRunResult(
                stdout='CountClassroomsWithInvalidTopicIds SUCCESS: 2'),
        ])
