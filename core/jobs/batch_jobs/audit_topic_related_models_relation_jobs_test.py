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

"""Unit tests for jobs.batch_jobs.audit_topic_related_models_relation_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import audit_topic_related_models_relation_jobs
from core.jobs.types import base_validation_errors
from core.jobs.types import model_property
from core.platform import models
from core.tests import test_utils

from typing import Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import topic_models

(topic_models,) = models.Registry.import_models([
    models.Names.TOPIC])


class ValidateTopicModelsJobTests(
    job_test_utils.JobTestBase,
    test_utils.GenericTestBase):

    JOB_CLASS: Type[(
        audit_topic_related_models_relation_jobs.ValidateTopicModelsJob)] = (
        audit_topic_related_models_relation_jobs.ValidateTopicModelsJob)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_valid_topic_models(self) -> None:
        topic_model = self.create_model(
            topic_models.TopicModel,
            id='topic_1',
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
        topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id='topic_1',
            manager_ids=[],
            topic_is_published=True,
            deleted=False)
        topic_summary_model = self.create_model(
            topic_models.TopicSummaryModel,
            id='topic_1',
            name='topic_1',
            canonical_name='canonical_name',
            language_code='en',
            description='this is description',
            url_fragment='url-fragment',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=5,
            additional_story_count=2,
            total_skill_count=10,
            total_published_node_count=3,
            uncategorized_skill_count=1,
            subtopic_count=4,
            thumbnail_filename='thumbnail.png',
            thumbnail_bg_color='#FFFFFF',
            version=1,
            published_story_exploration_mapping={},
            deleted=False)

        self.put_multi([topic_model, topic_rights_model, topic_summary_model])

        self.assert_job_output_is_empty()

    def test_missing_topic_rights_model(self) -> None:
        topic_model = self.create_model(
            topic_models.TopicModel,
            id='topic_1',
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
        topic_summary_model = self.create_model(
            topic_models.TopicSummaryModel,
            id='topic_1',
            name='topic_1',
            canonical_name='canonical_name',
            language_code='en',
            description='this is description',
            url_fragment='url-fragment',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=5,
            additional_story_count=2,
            total_skill_count=10,
            total_published_node_count=3,
            uncategorized_skill_count=1,
            subtopic_count=4,
            thumbnail_filename='thumbnail.png',
            thumbnail_bg_color='#FFFFFF',
            version=1,
            published_story_exploration_mapping={},
            deleted=False)

        self.put_multi([topic_model, topic_summary_model])

        self.assert_job_output_is([
            base_validation_errors.ModelRelationshipError(
                model_property.ModelProperty(
                    topic_models.TopicModel,
                    topic_models.TopicModel.name),
                    model_id='topic_1',
                    target_kind='TopicRightsModel',
                    target_id='topic_1'),
        ])

    def test_missing_topic_summary_model(self) -> None:
        topic_model = self.create_model(
            topic_models.TopicModel,
            id='topic_1',
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
        topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id='topic_1',
            manager_ids=[],
            topic_is_published=True,
            deleted=False)

        self.put_multi([topic_model, topic_rights_model])

        self.assert_job_output_is([
            base_validation_errors.ModelRelationshipError(
                id_property=model_property.ModelProperty(
                    topic_models.TopicModel,
                    topic_models.TopicModel.name),
                model_id='topic_1',
                target_kind='TopicSummaryModel',
                target_id='topic_1'),
        ])

    def test_multiple_topics_with_correct_relations(self) -> None:
        topic_model1 = self.create_model(
            topic_models.TopicModel,
            id='topic_1',
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
        topic_rights_model1 = self.create_model(
            topic_models.TopicRightsModel,
            id='topic_1',
            manager_ids=[],
            topic_is_published=True,
            deleted=False)
        topic_summary_model1 = self.create_model(
            topic_models.TopicSummaryModel,
            id='topic_1',
            name='topic_1',
            canonical_name='canonical_name',
            language_code='en',
            description='this is description',
            url_fragment='url-fragment',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=5,
            additional_story_count=2,
            total_skill_count=10,
            total_published_node_count=3,
            uncategorized_skill_count=1,
            subtopic_count=4,
            thumbnail_filename='thumbnail.png',
            thumbnail_bg_color='#FFFFFF',
            version=1,
            published_story_exploration_mapping={},
            deleted=False)

        topic_model2 = self.create_model(
            topic_models.TopicModel,
            id='topic_2',
            name='topic_2',
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
        topic_rights_model2 = self.create_model(
            topic_models.TopicRightsModel,
            id='topic_2',
            manager_ids=[],
            topic_is_published=True,
            deleted=False)
        topic_summary_model2 = self.create_model(
            topic_models.TopicSummaryModel,
            id='topic_2',
            name='topic_2',
            canonical_name='canonical_name',
            language_code='en',
            description='this is description',
            url_fragment='url-fragment',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=5,
            additional_story_count=2,
            total_skill_count=10,
            total_published_node_count=3,
            uncategorized_skill_count=1,
            subtopic_count=4,
            thumbnail_filename='thumbnail.png',
            thumbnail_bg_color='#FFFFFF',
            version=1,
            published_story_exploration_mapping={},
            deleted=False)

        self.put_multi([
            topic_model1, topic_model2,
            topic_rights_model1, topic_rights_model2,
            topic_summary_model1, topic_summary_model2,
        ])

        self.assert_job_output_is_empty()

    def test_mixed_valid_and_invalid_models(self) -> None:
        topic_model1 = self.create_model(
            topic_models.TopicModel,
            id='topic_1',
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
        topic_rights_model1 = self.create_model(
            topic_models.TopicRightsModel,
            id='topic_1',
            manager_ids=[],
            topic_is_published=True,
            deleted=False)
        topic_summary_model1 = self.create_model(
            topic_models.TopicSummaryModel,
            id='topic_1',
            name='topic_1',
            canonical_name='canonical_name',
            language_code='en',
            description='this is description',
            url_fragment='url-fragment',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=5,
            additional_story_count=2,
            total_skill_count=10,
            total_published_node_count=3,
            uncategorized_skill_count=1,
            subtopic_count=4,
            thumbnail_filename='thumbnail.png',
            thumbnail_bg_color='#FFFFFF',
            version=1,
            published_story_exploration_mapping={},
            deleted=False)

        topic_model2 = self.create_model(
            topic_models.TopicModel,
            id='topic_2',
            name='topic_2',
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
        topic_summary_model2 = self.create_model(
            topic_models.TopicSummaryModel,
            id='topic_2',
            name='topic_2',
            canonical_name='canonical_name',
            language_code='en',
            description='this is description',
            url_fragment='url-fragment',
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow(),
            canonical_story_count=5,
            additional_story_count=2,
            total_skill_count=10,
            total_published_node_count=3,
            uncategorized_skill_count=1,
            subtopic_count=4,
            thumbnail_filename='thumbnail.png',
            thumbnail_bg_color='#FFFFFF',
            version=1,
            published_story_exploration_mapping={},
            deleted=False)

        topic_model3 = self.create_model(
            topic_models.TopicModel,
            id='topic_3',
            name='topic_3',
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
        topic_rights_model3 = self.create_model(
            topic_models.TopicRightsModel,
            id='topic_3',
            manager_ids=[],
            topic_is_published=True,
            deleted=False)

        self.put_multi([
            topic_model1, topic_rights_model1, topic_summary_model1,
            topic_model2, topic_summary_model2,
            topic_model3, topic_rights_model3
        ])

        self.assert_job_output_is([
            base_validation_errors.ModelRelationshipError(
                model_property.ModelProperty(
                    topic_models.TopicModel,
                    topic_models.TopicModel.name),
                    model_id='topic_2',
                    target_kind='TopicRightsModel',
                    target_id='topic_2'),
            base_validation_errors.ModelRelationshipError(
                model_property.ModelProperty(
                    topic_models.TopicModel,
                    topic_models.TopicModel.name),
                    model_id='topic_3',
                    target_kind='TopicSummaryModel',
                    target_id='topic_3'),
        ])
