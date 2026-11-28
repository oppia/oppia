# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for StoryProgressModelValidationJob."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs.datastore_audit import user_jobs
from core.jobs.types import (
    base_validation_errors,
    model_property,
    user_validation_errors,
)
from core.platform import models

from typing import Dict, List, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, story_models, user_models

(base_models, story_models, user_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.STORY, models.Names.USER]
)


class StoryProgressModelValidationJobTests(job_test_utils.JobTestBase):
    """Tests for StoryProgressModelValidationJob."""

    JOB_CLASS: Type[user_jobs.StoryProgressModelValidationJob] = (
        user_jobs.StoryProgressModelValidationJob
    )

    def setUp(self) -> None:
        super().setUp()
        self.valid_user_id = 'uid_%s' % (
            'a' * feconf.USER_ID_RANDOM_PART_LENGTH
        )
        self.valid_story_id = 'a' * constants.STORY_ID_LENGTH
        self.valid_node_ids = ['node_1', 'node_2']

    def create_story_model(
        self,
        story_id: str,
        nodes: List[Dict[str, str]],
        deleted: bool = False,
    ) -> story_models.StoryModel:
        """Helper method to create a valid StoryModel."""
        initial_node = nodes[0]['id'] if nodes else 'node_1'
        return self.create_model(
            story_models.StoryModel,
            id=story_id,
            title='Title',
            description='Description',
            corresponding_topic_id='topic_id_0001',
            url_fragment='story-frag',
            story_contents_schema_version=1,
            language_code='en',
            notes='',
            story_contents={
                'nodes': nodes,
                'initial_node_id': initial_node,
                'next_node_id': 'node_99',
            },
            deleted=deleted,
        )

    def test_run_with_valid_model(self) -> None:
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.valid_user_id,
            email='test@example.com',
            username='user1',
        )
        story_model = self.create_story_model(
            self.valid_story_id,
            [{'id': 'node_1'}, {'id': 'node_2'}],
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='%s.%s' % (self.valid_user_id, self.valid_story_id),
            user_id=self.valid_user_id,
            story_id=self.valid_story_id,
            completed_node_ids=self.valid_node_ids,
        )

        self.put_multi([user_settings, story_model, story_progress])
        self.assert_job_output_is_empty()

    def test_run_with_domain_validation_error(self) -> None:
        # Invalid user_id format triggers domain validation error.
        invalid_user_id = 'invalid_user_id'
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=invalid_user_id,
            email='test@example.com',
            username='user1',
        )
        story_model = self.create_story_model(
            self.valid_story_id,
            [{'id': 'node_1'}, {'id': 'node_2'}],
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='%s.%s' % (invalid_user_id, self.valid_story_id),
            user_id=invalid_user_id,
            story_id=self.valid_story_id,
            completed_node_ids=self.valid_node_ids,
        )

        self.put_multi([user_settings, story_model, story_progress])
        self.assert_job_output_is(
            [
                {
                    'ModelDomainObjectValidateError': [
                        base_validation_errors.ModelDomainObjectValidateError(
                            story_progress,
                            'Invalid user ID: invalid_user_id',
                        ).stderr
                    ],
                }
            ]
        )

    def test_run_with_model_id_mismatch(self) -> None:
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.valid_user_id,
            email='test@example.com',
            username='user1',
        )
        story_model = self.create_story_model(
            self.valid_story_id,
            [{'id': 'node_1'}],
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='mismatched_id',
            user_id=self.valid_user_id,
            story_id=self.valid_story_id,
            completed_node_ids=['node_1'],
        )

        self.put_multi([user_settings, story_model, story_progress])
        self.assert_job_output_is(
            [
                {
                    'StoryProgressModelIdMismatchError': [
                        user_validation_errors.StoryProgressModelIdMismatchError(
                            story_progress
                        ).stderr
                    ]
                }
            ]
        )

    def test_run_with_missing_user_settings(self) -> None:
        story_model = self.create_story_model(
            self.valid_story_id,
            [{'id': 'node_1'}],
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='%s.%s' % (self.valid_user_id, self.valid_story_id),
            user_id=self.valid_user_id,
            story_id=self.valid_story_id,
            completed_node_ids=['node_1'],
        )

        self.put_multi([story_model, story_progress])
        self.assert_job_output_is(
            [
                {
                    'ModelRelationshipError': [
                        base_validation_errors.ModelRelationshipError(
                            id_property=model_property.ModelProperty(
                                user_models.StoryProgressModel,
                                user_models.StoryProgressModel.user_id,
                            ),
                            model=story_progress,
                            target_kind='UserSettingsModel',
                            target_id=self.valid_user_id,
                        ).stderr
                    ]
                }
            ]
        )

    def test_run_with_deleted_user_settings(self) -> None:
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.valid_user_id,
            email='test@example.com',
            username='user1',
            deleted=True,
        )
        story_model = self.create_story_model(
            self.valid_story_id,
            [{'id': 'node_1'}],
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='%s.%s' % (self.valid_user_id, self.valid_story_id),
            user_id=self.valid_user_id,
            story_id=self.valid_story_id,
            completed_node_ids=['node_1'],
        )

        self.put_multi([user_settings, story_model, story_progress])
        self.assert_job_output_is(
            [
                {
                    'ModelRelationshipError': [
                        base_validation_errors.ModelRelationshipError(
                            id_property=model_property.ModelProperty(
                                user_models.StoryProgressModel,
                                user_models.StoryProgressModel.user_id,
                            ),
                            model=story_progress,
                            target_kind='UserSettingsModel',
                            target_id=self.valid_user_id,
                        ).stderr
                    ]
                }
            ]
        )

    def test_run_with_system_user_bypasses_user_settings_check(self) -> None:
        story_model = self.create_story_model(
            self.valid_story_id,
            [{'id': 'node_1'}],
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='%s.%s' % (feconf.SYSTEM_COMMITTER_ID, self.valid_story_id),
            user_id=feconf.SYSTEM_COMMITTER_ID,
            story_id=self.valid_story_id,
            completed_node_ids=['node_1'],
        )

        self.put_multi([story_model, story_progress])
        self.assert_job_output_is_empty()

    def test_run_with_missing_story_model(self) -> None:
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.valid_user_id,
            email='test@example.com',
            username='user1',
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='%s.%s' % (self.valid_user_id, self.valid_story_id),
            user_id=self.valid_user_id,
            story_id=self.valid_story_id,
            completed_node_ids=['node_1'],
        )

        self.put_multi([user_settings, story_progress])
        self.assert_job_output_is(
            [
                {
                    'ModelRelationshipError': [
                        base_validation_errors.ModelRelationshipError(
                            id_property=model_property.ModelProperty(
                                user_models.StoryProgressModel,
                                user_models.StoryProgressModel.story_id,
                            ),
                            model=story_progress,
                            target_kind='StoryModel',
                            target_id=self.valid_story_id,
                        ).stderr
                    ]
                }
            ]
        )

    def test_run_with_deleted_story_model_persists_without_error(self) -> None:
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.valid_user_id,
            email='test@example.com',
            username='user1',
        )
        story_model = self.create_story_model(
            self.valid_story_id,
            [{'id': 'node_1'}],
            deleted=True,
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='%s.%s' % (self.valid_user_id, self.valid_story_id),
            user_id=self.valid_user_id,
            story_id=self.valid_story_id,
            completed_node_ids=['node_1'],
        )

        self.put_multi([user_settings, story_model, story_progress])
        self.assert_job_output_is_empty()

    def test_run_with_nonexistent_completed_node_id(self) -> None:
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.valid_user_id,
            email='test@example.com',
            username='user1',
        )
        story_model = self.create_story_model(
            self.valid_story_id,
            [{'id': 'node_1'}],
        )
        story_progress = self.create_model(
            user_models.StoryProgressModel,
            id='%s.%s' % (self.valid_user_id, self.valid_story_id),
            user_id=self.valid_user_id,
            story_id=self.valid_story_id,
            completed_node_ids=['node_1', 'node_2'],
        )

        self.put_multi([user_settings, story_model, story_progress])
        self.assert_job_output_is(
            [
                {
                    'NonexistentCompletedNodeIdError': [
                        user_validation_errors.NonexistentCompletedNodeIdError(
                            story_progress,
                            ['node_2'],
                        ).stderr
                    ]
                }
            ]
        )

    def test_validation_functions_ignore_non_story_progress_model(self) -> None:
        other_model = self.create_model(base_models.BaseModel, id='other_id')
        job_instance = self.JOB_CLASS(self.pipeline)

        self.assertEqual(
            list(job_instance.validate_domain_object(other_model)), []
        )
        self.assertEqual(list(job_instance.validate_model_id(other_model)), [])
        self.assertEqual(
            list(job_instance.validate_user_settings_relationship(other_model)),
            [],
        )
        self.assertEqual(
            list(job_instance.validate_story_relationship(other_model)), []
        )

    def test_get_validation_fns_and_domain_object_fn(self) -> None:
        job_instance = self.JOB_CLASS(self.pipeline)
        validation_fns = job_instance.get_validation_fns()
        self.assertEqual(len(validation_fns), 3)
        self.assertEqual(
            job_instance.get_validate_domain_object_fn(),
            job_instance.validate_domain_object,
        )
