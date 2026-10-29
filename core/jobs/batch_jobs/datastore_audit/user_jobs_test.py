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

"""Unit tests for jobs.batch_jobs.datastore_audit.user_jobs."""

from __future__ import annotations

from core.domain import exp_domain, exp_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs.datastore_audit import user_jobs
from core.jobs.types import (
    base_validation_errors,
    job_run_result,
    model_property,
    user_validation_errors,
)
from core.platform import models
from core.tests import test_utils

from typing import Final, List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, user_models

(exp_models, user_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER]
)


class ExpUserLastPlaythroughModelValidationJobTests(
    test_utils.GenericTestBase, job_test_utils.JobTestBase
):

    JOB_CLASS = user_jobs.ExpUserLastPlaythroughModelValidationJob

    EXP_ID: Final = 'exp_id'
    LEARNER_EMAIL: Final = 'learner@example.com'
    LEARNER_USERNAME: Final = 'learner'
    RENAMED_STATE_NAME: Final = 'Renamed state'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.LEARNER_EMAIL, self.LEARNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.learner_id = self.get_user_id_from_email(self.LEARNER_EMAIL)

        # Version 1 of the exploration has one state, which is renamed in
        # version 2.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id
        )
        self.init_state_name = exploration.init_state_name
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_RENAME_STATE,
                        'old_state_name': self.init_state_name,
                        'new_state_name': self.RENAMED_STATE_NAME,
                    }
                )
            ],
            'Rename the first state.',
        )

    def _create_playthrough_model(
        self,
        model_id: Optional[str] = None,
        user_id: Optional[str] = None,
        last_played_exp_version: Optional[int] = 2,
        last_played_state_name: Optional[str] = RENAMED_STATE_NAME,
    ) -> user_models.ExpUserLastPlaythroughModel:
        """Creates an ExpUserLastPlaythroughModel for the exploration.

        Args:
            model_id: str|None. The ID of the model. Defaults to the ID built
                from the user ID and the exploration ID.
            user_id: str|None. The ID of the user. Defaults to the learner.
            last_played_exp_version: int|None. The last played version.
            last_played_state_name: str|None. The last played state name.

        Returns:
            ExpUserLastPlaythroughModel. The created model.
        """
        user_id = user_id or self.learner_id
        return self.create_model(
            user_models.ExpUserLastPlaythroughModel,
            id=model_id or '%s.%s' % (user_id, self.EXP_ID),
            user_id=user_id,
            exploration_id=self.EXP_ID,
            last_played_exp_version=last_played_exp_version,
            last_played_state_name=last_played_state_name,
        )

    def _create_incomplete_activities_model(
        self, user_id: str, exploration_ids: List[str]
    ) -> user_models.IncompleteActivitiesModel:
        """Creates an IncompleteActivitiesModel for the given user.

        Args:
            user_id: str. The ID of the user.
            exploration_ids: list(str). The incomplete exploration IDs.

        Returns:
            IncompleteActivitiesModel. The created model.
        """
        return self.create_model(
            user_models.IncompleteActivitiesModel,
            id=user_id,
            exploration_ids=exploration_ids,
        )

    def _get_job_result(
        self, *errors: base_validation_errors.BaseValidationError
    ) -> job_run_result.JobRunResult:
        """Returns the job result that summarizes errors of a single type.

        Args:
            *errors: BaseValidationError. The errors, all of the same type.

        Returns:
            JobRunResult. The expected job result.
        """
        return job_run_result.JobRunResult.as_stderr(
            '%s (%d total):\n%s'
            % (
                errors[0].__class__.__name__,
                len(errors),
                '\n'.join(sorted(error.stderr for error in errors)),
            )
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_valid_model_at_latest_version(self) -> None:
        self.put_multi(
            [
                self._create_playthrough_model(),
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is_empty()

    def test_valid_model_with_state_renamed_after_it_was_played(self) -> None:
        # The state is still called by its old name in version 1, which is
        # the version that the learner played.
        self.put_multi(
            [
                self._create_playthrough_model(
                    last_played_exp_version=1,
                    last_played_state_name=self.init_state_name,
                ),
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is_empty()

    def test_invalid_domain_object(self) -> None:
        model = self._create_playthrough_model(last_played_exp_version=0)
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        # The version is not used to look up the exploration, so only the
        # domain validation error is reported.
        self.assert_job_output_is(
            [
                self._get_job_result(
                    base_validation_errors.ModelDomainObjectValidateError(
                        model,
                        'Expected last_played_exp_version to be an integer '
                        '>= 1, received 0',
                    )
                )
            ]
        )

    def test_model_with_missing_last_played_information(self) -> None:
        model = self._create_playthrough_model(
            last_played_exp_version=None, last_played_state_name=None
        )
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is(
            [
                self._get_job_result(
                    base_validation_errors.ModelDomainObjectValidateError(
                        model,
                        'Expected last_played_exp_version to be an integer '
                        '>= 1, received None',
                    )
                )
            ]
        )

    def test_model_with_id_not_matching_its_fields(self) -> None:
        model = self._create_playthrough_model(
            model_id='%s.other_exp_id' % self.learner_id
        )
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is(
            [
                self._get_job_result(
                    user_validation_errors.InvalidExpUserLastPlaythroughIdError(
                        model
                    )
                )
            ]
        )

    def test_model_with_nonexistent_user(self) -> None:
        user_id = 'uid_%s' % ('a' * 32)
        model = self._create_playthrough_model(user_id=user_id)
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    user_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is(
            [
                self._get_job_result(
                    base_validation_errors.ModelRelationshipError(
                        model_property.ModelProperty(
                            user_models.ExpUserLastPlaythroughModel,
                            user_models.ExpUserLastPlaythroughModel.user_id,
                        ),
                        model,
                        'UserSettingsModel',
                        user_id,
                    )
                )
            ]
        )

    def test_model_with_deleted_exploration(self) -> None:
        exp_services.delete_exploration(self.owner_id, self.EXP_ID)
        model = self._create_playthrough_model()
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is(
            [
                self._get_job_result(
                    base_validation_errors.ModelRelationshipError(
                        model_property.ModelProperty(
                            user_models.ExpUserLastPlaythroughModel,
                            user_models.ExpUserLastPlaythroughModel.exploration_id,
                        ),
                        model,
                        'ExplorationModel',
                        self.EXP_ID,
                    )
                )
            ]
        )

    def test_model_with_version_greater_than_exploration_version(
        self,
    ) -> None:
        model = self._create_playthrough_model(last_played_exp_version=3)
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is(
            [
                self._get_job_result(
                    user_validation_errors.LastPlayedExpVersionTooHighError(
                        model, 2
                    )
                )
            ]
        )

    def test_model_with_missing_exploration_version(self) -> None:
        exp_models.ExplorationSnapshotContentModel.get_by_id(
            exp_models.ExplorationModel.get_snapshot_id(self.EXP_ID, 1)
        ).delete()
        model = self._create_playthrough_model(
            last_played_exp_version=1,
            last_played_state_name=self.init_state_name,
        )
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is(
            [
                self._get_job_result(
                    user_validation_errors.LastPlayedExpVersionNotFoundError(
                        model
                    )
                )
            ]
        )

    def test_model_with_state_not_in_played_version(self) -> None:
        # The state was renamed in version 2, so its old name is not a state
        # of version 2.
        model = self._create_playthrough_model(
            last_played_exp_version=2,
            last_played_state_name=self.init_state_name,
        )
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    self.learner_id, [self.EXP_ID]
                ),
            ]
        )

        self.assert_job_output_is(
            [
                self._get_job_result(
                    user_validation_errors.LastPlayedStateNotInExplorationError(
                        model
                    )
                )
            ]
        )

    def test_model_without_incomplete_activities_model(self) -> None:
        model = self._create_playthrough_model()
        self.put_multi([model])

        self.assert_job_output_is(
            [
                self._get_job_result(
                    user_validation_errors.ExplorationNotMarkedIncompleteError(
                        model
                    )
                )
            ]
        )

    def test_model_with_exploration_not_marked_incomplete(self) -> None:
        model = self._create_playthrough_model()
        self.put_multi(
            [
                model,
                self._create_incomplete_activities_model(
                    self.learner_id, ['other_exp_id']
                ),
            ]
        )

        self.assert_job_output_is(
            [
                self._get_job_result(
                    user_validation_errors.ExplorationNotMarkedIncompleteError(
                        model
                    )
                )
            ]
        )

    def test_model_with_multiple_errors(self) -> None:
        user_id = 'uid_%s' % ('b' * 32)
        model = self._create_playthrough_model(
            user_id=user_id, last_played_exp_version=3
        )
        self.put_multi([model])

        self.assert_job_output_is(
            [
                self._get_job_result(
                    base_validation_errors.ModelRelationshipError(
                        model_property.ModelProperty(
                            user_models.ExpUserLastPlaythroughModel,
                            user_models.ExpUserLastPlaythroughModel.user_id,
                        ),
                        model,
                        'UserSettingsModel',
                        user_id,
                    )
                ),
                self._get_job_result(
                    user_validation_errors.LastPlayedExpVersionTooHighError(
                        model, 2
                    )
                ),
                self._get_job_result(
                    user_validation_errors.ExplorationNotMarkedIncompleteError(
                        model
                    )
                ),
            ]
        )
