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

"""Unit tests for user_activities_stale_exploration_cleanup_jobs."""

from __future__ import annotations

from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import user_activities_stale_exploration_cleanup_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, user_models

(exp_models, user_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER]
)


class AuditStaleActivitiesExplorationRefsJobTest(job_test_utils.JobTestBase):
    """Tests for AuditStaleActivitiesExplorationRefsJob."""

    JOB_CLASS: Type[
        user_activities_stale_exploration_cleanup_jobs.AuditStaleActivitiesExplorationRefsJob
    ] = (
        user_activities_stale_exploration_cleanup_jobs.AuditStaleActivitiesExplorationRefsJob
    )

    EXP_1: Final = 'exp_1'
    EXP_2: Final = 'exp_2'
    EXP_3: Final = 'exp_3'
    DELETED_EXP: Final = 'deleted_exp'
    PRIVATE_EXP: Final = 'private_exp'
    USER_1: Final = 'user_1'
    USER_2: Final = 'user_2'

    def _create_exploration(self, exp_id: str, status: str) -> None:
        """Creates an ExplorationModel and ExplorationRightsModel.

        Args:
            exp_id: str. The exploration ID.
            status: str. The publication status of the exploration.
        """
        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test Exploration',
            category='Test',
            objective='Test objective',
            language_code='en',
            init_state_name='Introduction',
            states={'Introduction': {}},
            states_schema_version=1,
            next_content_id_index=0,
            deleted=False,
        )
        rights_model = self.create_model(
            exp_models.ExplorationRightsModel,
            id=exp_id,
            owner_ids=['owner'],
            editor_ids=[],
            voice_artist_ids=[],
            viewer_ids=[],
            community_owned=False,
            status=status,
            viewable_if_private=False,
            deleted=False,
        )
        self.put_multi([exp_model, rights_model])

    def test_empty_datastore(self) -> None:
        """Tests that an empty datastore produces no output."""
        self.assert_job_output_is([])

    def test_all_valid_explorations_produces_no_output(self) -> None:
        """Tests that models referencing only valid public explorations
        do not appear as stale.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        self._create_exploration(self.EXP_2, constants.ACTIVITY_STATUS_PUBLIC)

        completed_model = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.EXP_2],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        incomplete_model = self.create_model(
            user_models.IncompleteActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1],
            collection_ids=[],
            story_ids=[],
            partially_learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_model, incomplete_model])

        self.assert_job_output_is([])

    def test_deleted_exploration_detected_in_completed_model(self) -> None:
        """Tests that a CompletedActivitiesModel referencing a deleted
        exploration is reported as stale.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        # DELETED_EXP has no ExplorationModel, simulating deletion.

        completed_model = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.DELETED_EXP],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_completed_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'CompletedActivitiesModel id={self.USER_1}: '
                    f'stale_exp_ids=[\'{self.DELETED_EXP}\']'
                ),
            ]
        )

    def test_private_exploration_detected_in_incomplete_model(self) -> None:
        """Tests that an IncompleteActivitiesModel referencing a private
        exploration is reported as stale.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        self._create_exploration(
            self.PRIVATE_EXP, constants.ACTIVITY_STATUS_PRIVATE
        )

        incomplete_model = self.create_model(
            user_models.IncompleteActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.PRIVATE_EXP],
            collection_ids=[],
            story_ids=[],
            partially_learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([incomplete_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_incomplete_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'IncompleteActivitiesModel id={self.USER_1}: '
                    f'stale_exp_ids=[\'{self.PRIVATE_EXP}\']'
                ),
            ]
        )

    def test_mixed_stale_refs_across_both_models(self) -> None:
        """Tests that stale references are detected in both Completed and
        Incomplete activity models for the same user.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        self._create_exploration(self.EXP_2, constants.ACTIVITY_STATUS_PUBLIC)
        # DELETED_EXP is deleted (no model).
        self._create_exploration(
            self.PRIVATE_EXP, constants.ACTIVITY_STATUS_PRIVATE
        )

        completed_model = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.DELETED_EXP],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        incomplete_model = self.create_model(
            user_models.IncompleteActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_2, self.PRIVATE_EXP],
            collection_ids=[],
            story_ids=[],
            partially_learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_model, incomplete_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_completed_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'stale_incomplete_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'CompletedActivitiesModel id={self.USER_1}: '
                    f'stale_exp_ids=[\'{self.DELETED_EXP}\']'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'IncompleteActivitiesModel id={self.USER_1}: '
                    f'stale_exp_ids=[\'{self.PRIVATE_EXP}\']'
                ),
            ]
        )

    def test_multiple_users_with_stale_refs(self) -> None:
        """Tests that stale references from multiple users are all
        detected.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        # DELETED_EXP is deleted.

        completed_user_1 = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.DELETED_EXP],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        completed_user_2 = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_2,
            exploration_ids=[self.DELETED_EXP],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_user_1, completed_user_2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_completed_activities_models_count: 2'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'CompletedActivitiesModel id={self.USER_1}: '
                    f'stale_exp_ids=[\'{self.DELETED_EXP}\']'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'CompletedActivitiesModel id={self.USER_2}: '
                    f'stale_exp_ids=[\'{self.DELETED_EXP}\']'
                ),
            ]
        )


class CleanupStaleActivitiesExplorationRefsJobTest(job_test_utils.JobTestBase):
    """Tests for CleanupStaleActivitiesExplorationRefsJob."""

    JOB_CLASS: Type[
        user_activities_stale_exploration_cleanup_jobs.CleanupStaleActivitiesExplorationRefsJob
    ] = (
        user_activities_stale_exploration_cleanup_jobs.CleanupStaleActivitiesExplorationRefsJob
    )

    EXP_1: Final = 'exp_1'
    EXP_2: Final = 'exp_2'
    DELETED_EXP: Final = 'deleted_exp'
    PRIVATE_EXP: Final = 'private_exp'
    USER_1: Final = 'user_1'
    USER_2: Final = 'user_2'

    def _create_exploration(self, exp_id: str, status: str) -> None:
        """Creates an ExplorationModel and ExplorationRightsModel.

        Args:
            exp_id: str. The exploration ID.
            status: str. The publication status of the exploration.
        """
        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test Exploration',
            category='Test',
            objective='Test objective',
            language_code='en',
            init_state_name='Introduction',
            states={'Introduction': {}},
            states_schema_version=1,
            next_content_id_index=0,
            deleted=False,
        )
        rights_model = self.create_model(
            exp_models.ExplorationRightsModel,
            id=exp_id,
            owner_ids=['owner'],
            editor_ids=[],
            voice_artist_ids=[],
            viewer_ids=[],
            community_owned=False,
            status=status,
            viewable_if_private=False,
            deleted=False,
        )
        self.put_multi([exp_model, rights_model])

    def test_empty_datastore(self) -> None:
        """Tests that an empty datastore produces no output."""
        self.assert_job_output_is([])

    def test_cleanup_removes_deleted_exp_from_completed_model(self) -> None:
        """Tests that a deleted exploration ID is removed from the
        CompletedActivitiesModel after the migration job runs.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        # DELETED_EXP has no ExplorationModel, simulating deletion.

        completed_model = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.DELETED_EXP],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_completed_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_completed_activities_models_count: 1'
                ),
            ]
        )

        # Verify the model was updated in the datastore.
        updated_model = user_models.CompletedActivitiesModel.get(self.USER_1)
        self.assertEqual(updated_model.exploration_ids, [self.EXP_1])

    def test_cleanup_removes_private_exp_from_incomplete_model(self) -> None:
        """Tests that a private exploration ID is removed from the
        IncompleteActivitiesModel after the migration job runs.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        self._create_exploration(
            self.PRIVATE_EXP, constants.ACTIVITY_STATUS_PRIVATE
        )

        incomplete_model = self.create_model(
            user_models.IncompleteActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.PRIVATE_EXP],
            collection_ids=[],
            story_ids=[],
            partially_learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([incomplete_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_incomplete_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_incomplete_activities_models_count: 1'
                ),
            ]
        )

        # Verify the model was updated in the datastore.
        updated_model = user_models.IncompleteActivitiesModel.get(self.USER_1)
        self.assertEqual(updated_model.exploration_ids, [self.EXP_1])

    def test_cleanup_with_all_valid_explorations_is_noop(self) -> None:
        """Tests that models referencing only valid public explorations
        are not modified by the migration job.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        self._create_exploration(self.EXP_2, constants.ACTIVITY_STATUS_PUBLIC)

        completed_model = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.EXP_2],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_model])

        self.assert_job_output_is([])

        # Verify the model was not altered.
        updated_model = user_models.CompletedActivitiesModel.get(self.USER_1)
        self.assertEqual(
            updated_model.exploration_ids, [self.EXP_1, self.EXP_2]
        )

    def test_cleanup_handles_both_models_for_same_user(self) -> None:
        """Tests that both CompletedActivitiesModel and
        IncompleteActivitiesModel are cleaned for the same user.
        """
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        self._create_exploration(self.EXP_2, constants.ACTIVITY_STATUS_PUBLIC)
        # DELETED_EXP is deleted.
        self._create_exploration(
            self.PRIVATE_EXP, constants.ACTIVITY_STATUS_PRIVATE
        )

        completed_model = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.DELETED_EXP],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        incomplete_model = self.create_model(
            user_models.IncompleteActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_2, self.PRIVATE_EXP],
            collection_ids=[],
            story_ids=[],
            partially_learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_model, incomplete_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_completed_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'stale_incomplete_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_completed_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_incomplete_activities_models_count: 1'
                ),
            ]
        )

        updated_completed = user_models.CompletedActivitiesModel.get(
            self.USER_1
        )
        self.assertEqual(updated_completed.exploration_ids, [self.EXP_1])

        updated_incomplete = user_models.IncompleteActivitiesModel.get(
            self.USER_1
        )
        self.assertEqual(updated_incomplete.exploration_ids, [self.EXP_2])

    def test_cleanup_removes_all_stale_when_all_exp_ids_are_stale(
        self,
    ) -> None:
        """Tests that a model whose exploration_ids are all stale ends up
        with an empty list after migration.
        """
        # No explorations exist at all.
        completed_model = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.DELETED_EXP, 'also_deleted'],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_completed_activities_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_completed_activities_models_count: 1'
                ),
            ]
        )

        updated_model = user_models.CompletedActivitiesModel.get(self.USER_1)
        self.assertEqual(updated_model.exploration_ids, [])

    def test_cleanup_handles_multiple_users(self) -> None:
        """Tests that stale refs from multiple users are all cleaned."""
        self._create_exploration(self.EXP_1, constants.ACTIVITY_STATUS_PUBLIC)
        # DELETED_EXP is deleted.

        completed_user_1 = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_1,
            exploration_ids=[self.EXP_1, self.DELETED_EXP],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        completed_user_2 = self.create_model(
            user_models.CompletedActivitiesModel,
            id=self.USER_2,
            exploration_ids=[self.DELETED_EXP],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            deleted=False,
        )
        self.put_multi([completed_user_1, completed_user_2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'stale_completed_activities_models_count: 2'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_completed_activities_models_count: 2'
                ),
            ]
        )

        updated_user_1 = user_models.CompletedActivitiesModel.get(self.USER_1)
        self.assertEqual(updated_user_1.exploration_ids, [self.EXP_1])

        updated_user_2 = user_models.CompletedActivitiesModel.get(self.USER_2)
        self.assertEqual(updated_user_2.exploration_ids, [])
