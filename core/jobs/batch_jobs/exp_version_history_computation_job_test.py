# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.exp_version_history_computation_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_version_history_computation_job
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
datastore_services = models.Registry.import_datastore_services()


class ComputeExplorationVersionHistoryJobTests(
    test_utils.GenericTestBase, job_test_utils.JobTestBase
):
    JOB_CLASS = (
        exp_version_history_computation_job.ComputeExplorationVersionHistoryJob
    )

    USER_1_EMAIL = 'user1@example.com'
    USER_2_EMAIL = 'user2@example.com'
    USER_1_USERNAME = 'user1'
    USER_2_USERNAME = 'user2'
    EXP_ID_1 = 'exp_1'
    EXP_ID_2 = 'exp_2'

    def setUp(self):
        super(ComputeExplorationVersionHistoryJobTests, self).setUp()

        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)

        self.user_1_id = user_services.get_user_id_from_username(
            self.USER_1_USERNAME
        )
        self.user_2_id = user_services.get_user_id_from_username(
            self.USER_2_USERNAME
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_creates_version_history_for_single_exp_with_valid_changes(
        self
    ) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit message.')
        version_history_keys = [
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 1
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 2
                )
            )
        ]
        # Deleting the version history models as they were created by
        # exp_services while creating and updating the explorations. We want
        # to test that the beam job can create the models from scratch.
        datastore_services.delete_multi(version_history_keys)

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is None

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN WAS COMPUTED SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'CREATED OR MODIFIED VERSION HISTORY MODELS SUCCESS: 2'
            )
        ])

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is not None

    def test_no_model_is_created_for_exp_with_invalid_changes(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        self.save_new_default_exploration(self.EXP_ID_2, self.user_1_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit message.')
        version_history_keys = [
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 1
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 2
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_2, 1
                )
            )
        ]
        # Deleting the version history models as they were created by
        # exp_services while creating and updating the explorations. We want
        # to test that the beam job can create the models from scratch.
        datastore_services.delete_multi(version_history_keys)

        # Having invalid change list is not possible if the exploration is
        # updated using exp_services. Hence, we have to simulate the scenario
        # manually by changing the commit logs.
        commit_log_model = exp_models.ExplorationCommitLogEntryModel.get(
            exp_models.ExplorationCommitLogEntryModel.get_instance_id(
                self.EXP_ID_1, 2
            )
        )
        commit_log_model.commit_cmds = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': feconf.DEFAULT_INIT_STATE_NAME
            }).to_dict()
        ]
        commit_log_model.update_timestamps()
        commit_log_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 2'),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED SUCCESS: 2'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS HAVING INVALID CHANGE LIST SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN WAS COMPUTED SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'CREATED OR MODIFIED VERSION HISTORY MODELS SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stderr(
                'Exploration %s has invalid change list' % (self.EXP_ID_1)
            )
        ])

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            if model is not None:
                self.assertEqual(model.exploration_id, self.EXP_ID_2)

    def test_create_version_history_for_exp_with_revert_commit(
        self
    ) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit message.')
        exp_services.revert_exploration(self.user_1_id, self.EXP_ID_1, 2, 1)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'Another new state'
            })
        ], 'A commit message.')
        version_history_keys = [
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 1
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 2
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 3
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 4
                )
            )
        ]
        # Deleting the version history models as they were created by
        # exp_services while creating and updating the explorations. We want
        # to test that the beam job can create the models from scratch.
        datastore_services.delete_multi(version_history_keys)

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is None

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN WAS COMPUTED SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'CREATED OR MODIFIED VERSION HISTORY MODELS SUCCESS: 4'
            )
        ])

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is not None

    def test_no_model_is_created_for_exp_with_invalid_revert_version(
        self
    ) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit message.')
        exp_services.revert_exploration(self.user_1_id, self.EXP_ID_1, 2, 1)
        version_history_keys = [
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 1
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 2
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 3
                )
            )
        ]
        # Deleting the version history models as they were created by
        # exp_services while creating and updating the explorations. We want
        # to test that the beam job can create the models from scratch.
        datastore_services.delete_multi(version_history_keys)

        # Having invalid change list is not possible if the exploration is
        # updated using exp_services. Hence, we have to simulate the scenario
        # manually by changing the commit logs.
        commit_log_model = exp_models.ExplorationCommitLogEntryModel.get(
            exp_models.ExplorationCommitLogEntryModel.get_instance_id(
                self.EXP_ID_1, 3
            )
        )
        commit_log_model.commit_cmds = [
            exp_domain.ExplorationChange({
                'cmd': feconf.CMD_REVERT_COMMIT,
                'version_number': 4
            }).to_dict()
        ]
        commit_log_model.update_timestamps()
        commit_log_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS HAVING INVALID CHANGE LIST SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stderr(
                'Exploration %s has invalid change list' % (self.EXP_ID_1)
            )
        ])

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is None

    def test_creates_version_history_for_multiple_exps_with_valid_changes(
        self
    ) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_2_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit messages.')
        version_history_keys = [
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 1
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 2
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_2, 1
                )
            )
        ]
        # Deleting the version history models as they were created by
        # exp_services while creating and updating the explorations. We want
        # to test that the beam job can create the models from scratch.
        datastore_services.delete_multi(version_history_keys)

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is None

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 2'),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED SUCCESS: 2'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN WAS COMPUTED SUCCESS: 2'
            ),
            job_run_result.JobRunResult.as_stdout(
                'CREATED OR MODIFIED VERSION HISTORY MODELS SUCCESS: 3'
            )
        ])

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is not None

    def test_job_can_run_when_version_history_already_exists(self):
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_2_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit messages.')
        exp_services.revert_exploration(self.user_1_id, self.EXP_ID_1, 2, 1)
        version_history_keys = [
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 1
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 2
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 3
                )
            ),
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_2, 1
                )
            )
        ]

        # We are not deleting the version history models this time. Also,
        # they will be created while updating the exploration by exp_services.
        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is not None

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 2'),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED SUCCESS: 2'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN WAS COMPUTED SUCCESS: 2'
            ),
            job_run_result.JobRunResult.as_stdout(
                'CREATED OR MODIFIED VERSION HISTORY MODELS SUCCESS: 4'
            )
        ])

        version_history_models = datastore_services.get_multi(
            version_history_keys
        )
        for model in version_history_models:
            assert model is not None

    def test_ignore_exps_having_outdated_states_schema_version(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        version_history_keys = [
            datastore_services.Key(
                exp_models.ExplorationVersionHistoryModel,
                exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    self.EXP_ID_1, 1
                )
            )
        ]
        datastore_services.delete_multi(version_history_keys)
        swap_earlier_state_to_60 = (
            self.swap(feconf, 'EARLIEST_SUPPORTED_STATE_SCHEMA_VERSION', 60)
        )
        swap_current_state_61 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 61)
        with swap_earlier_state_to_60, swap_current_state_61:
            self.assert_job_output_is([
                job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 1'),
                job_run_result.JobRunResult.as_stdout(
                    'EXPS VLATEST HAVING OUTDATED STATES SCHEMA SUCCESS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'EXPS V1 HAVING OUTDATED STATES SCHEMA SUCCESS: 1'
                ),
                job_run_result.JobRunResult.as_stderr(
                    'Version history cannot be calculated for %s' % (
                        self.EXP_ID_1
                    )
                ),
                job_run_result.JobRunResult.as_stderr(
                    'Version history cannot be calculated for %s' % (
                        self.EXP_ID_1
                    )
                )
            ])


class VerifyVersionHistoryModelsJobTests(
    test_utils.GenericTestBase, job_test_utils.JobTestBase
):
    JOB_CLASS = (
        exp_version_history_computation_job.VerifyVersionHistoryModelsJob
    )

    USER_1_EMAIL = 'user1@example.com'
    USER_2_EMAIL = 'user2@example.com'
    USER_1_USERNAME = 'user1'
    USER_2_USERNAME = 'user2'
    EXP_ID_1 = 'exp_1'
    EXP_ID_2 = 'exp_2'

    def setUp(self):
        super(VerifyVersionHistoryModelsJobTests, self).setUp()

        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)

        self.user_1_id = user_services.get_user_id_from_username(
            self.USER_1_USERNAME
        )
        self.user_2_id = user_services.get_user_id_from_username(
            self.USER_2_USERNAME
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_with_valid_version_history_models(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_2_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit messages.')
        exp_services.update_exploration(self.user_2_id, self.EXP_ID_2, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit messages.')

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                'ALL EXPLORATIONS SUCCESS: 2'
            ),
            job_run_result.JobRunResult.as_stdout(
                'VERIFIED EXPLORATIONS SUCCESS: 2'
            )
        ])

    def test_with_invalid_version_history_models(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_2_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state'
            })
        ], 'A commit messages.')

        # Manually corrupting the version history model.
        vh_model = exp_models.ExplorationVersionHistoryModel.get(
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                self.EXP_ID_1, 2
            )
        )
        vh_model.metadata_last_edited_version_number = 1
        vh_model.update_timestamps()
        vh_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                'ALL EXPLORATIONS SUCCESS: 2'
            ),
            job_run_result.JobRunResult.as_stdout(
                'VERIFIED EXPLORATIONS SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'UNVERIFIED EXPLORATIONS SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stderr(
                'Version history for exploration with ID %s was not '
                'created correctly' % (self.EXP_ID_1)
            )
        ])
