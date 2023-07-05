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
from core.domain import translation_domain
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

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])
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

    def setUp(self) -> None:
        super().setUp()

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
        assert self.user_1_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
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

    def test_create_version_history_for_exp_with_revert_commit(
        self
    ) -> None:
        assert self.user_1_id is not None
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit message.')
        exp_services.revert_exploration(
            self.user_1_id, self.EXP_ID_1, 2, 1
        )
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'Another new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
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
        assert self.user_1_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit message.')
        exp_services.revert_exploration(
            self.user_1_id, self.EXP_ID_1, 2, 1
        )
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
        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                exp_models.ExplorationModel.get_snapshot_id(
                    self.EXP_ID_1, 3
                )
            )
        )
        snapshot_metadata_model.commit_cmds = [
            exp_domain.ExplorationChange({
                'cmd': feconf.CMD_REVERT_COMMIT,
                'version_number': 4
            }).to_dict()
        ]
        snapshot_metadata_model.update_timestamps()
        snapshot_metadata_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS HAVING INVALID CHANGE LIST SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stderr(
                'Exploration exp_1 has invalid change list. Error: Reverting '
                'to the version 4 which is out of the range [1, 2]. Version: 3'
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
        assert self.user_1_id is not None
        assert self.user_2_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_2_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
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

    def test_job_can_run_when_version_history_already_exists(self) -> None:
        assert self.user_1_id is not None
        assert self.user_2_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_2_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')
        exp_services.revert_exploration(
            self.user_1_id, self.EXP_ID_1, 2, 1
        )
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

    def test_ignore_changes_in_deprecated_properties(self) -> None:
        assert self.user_1_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')
        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                exp_models.ExplorationModel.get_snapshot_id(
                    self.EXP_ID_1, 2
                )
            )
        )
        snapshot_metadata_model.commit_cmds.append({
            'cmd': 'edit_state_property',
            'state_name': 'A new state',
            'property_name': 'fallbacks',
            'new_value': 'foo',
        })
        snapshot_metadata_model.update_timestamps()
        snapshot_metadata_model.put()

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

    def test_with_invalid_change_list(self) -> None:
        assert self.user_1_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')

        # Corrupting the commit logs manually.
        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                exp_models.ExplorationModel.get_snapshot_id(
                    self.EXP_ID_1, 2
                )
            )
        )
        snapshot_metadata_model.commit_cmds.append({
            'cmd': 'delete_state',
            'state_name': 'Some other state',
        })
        snapshot_metadata_model.update_timestamps()
        snapshot_metadata_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout(
                'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'EXPS HAVING INVALID CHANGE LIST SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stderr(
                'Exploration exp_1 has invalid change list. '
                'Error: \'Some other state\'. Version: 2'
            )
        ])

    def test_with_corrupted_snapshot_model(self) -> None:
        assert self.user_1_id is not None
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)

        snapshot_class = exp_models.ExplorationSnapshotContentModel
        snapshot_model = snapshot_class.get('%s%s%s' % (self.EXP_ID_1, '-', 1))
        snapshot_model.content = None
        snapshot_model.update_timestamps()
        snapshot_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('ALL EXPS SUCCESS: 1')
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

    def setUp(self) -> None:
        super().setUp()

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
        assert self.user_1_id is not None
        assert self.user_2_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        self.save_new_valid_exploration('3', self.user_2_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')

        exp = self.save_new_valid_exploration(self.EXP_ID_2, self.user_2_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        exp_services.update_exploration(self.user_2_id, self.EXP_ID_2, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')
        exp_services.update_exploration(self.user_2_id, '3', [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'Introduction',
                'new_state_name': 'First state'
            })
        ], 'A commit message.')

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                'ALL EXPLORATIONS SUCCESS: 3'
            ),
            job_run_result.JobRunResult.as_stdout(
                'VERIFIED EXPLORATIONS SUCCESS: 3'
            )
        ])

    def test_with_invalid_version_history_models(self) -> None:
        assert self.user_1_id is not None
        assert self.user_2_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_2_id)
        self.save_new_valid_exploration('3', self.user_2_id)
        exp4 = self.save_new_valid_exploration('4', self.user_2_id)
        self.save_new_valid_exploration('5', self.user_2_id)
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')
        exp_services.update_exploration(self.user_2_id, self.EXP_ID_2, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'Introduction',
                'new_state_name': 'First state'
            })
        ], 'A commit message.')
        exp_services.update_exploration(self.user_2_id, '3', [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'Introduction',
                'new_state_name': 'First state'
            })
        ], 'A commit message.')
        content_id_generator = translation_domain.ContentIdGenerator(
            exp4.next_content_id_index
        )
        exp_services.update_exploration(self.user_1_id, '4', [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')
        exp_services.update_exploration(self.user_2_id, '5', [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'Introduction',
                'new_state_name': 'Second state'
            })
        ], 'A commit message.')

        # Manually corrupting the version history model.
        vh_model_1 = exp_models.ExplorationVersionHistoryModel.get(
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                self.EXP_ID_1, 2
            )
        )
        vh_model_1.state_version_history['A new state'][
            'state_name_in_previous_version'] = 'Previous state'
        vh_model_2 = exp_models.ExplorationVersionHistoryModel.get(
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                self.EXP_ID_2, 2
            )
        )
        vh_model_2.state_version_history['First state'][
            'previously_edited_in_version'] = 0
        vh_model_2.state_version_history['First state'][
            'state_name_in_previous_version'] = 'Previous state'
        vh_model_3 = exp_models.ExplorationVersionHistoryModel.get(
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                '3', 2
            )
        )
        del vh_model_3.state_version_history['First state']
        vh_model_4 = exp_models.ExplorationVersionHistoryModel.get(
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                '4', 2
            )
        )
        del vh_model_4.state_version_history['A new state']
        vh_model_5 = exp_models.ExplorationVersionHistoryModel.get(
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                '5', 2
            )
        )
        vh_model_5.state_version_history['Second state'][
            'state_name_in_previous_version'] = 'First state'
        exp_models.ExplorationVersionHistoryModel.update_timestamps_multi([
            vh_model_1, vh_model_2, vh_model_3, vh_model_4, vh_model_5
        ])
        exp_models.ExplorationVersionHistoryModel.put_multi([
            vh_model_1, vh_model_2, vh_model_3, vh_model_4, vh_model_5
        ])

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                'ALL EXPLORATIONS SUCCESS: 5'
            ),
            job_run_result.JobRunResult.as_stdout(
                'UNVERIFIED EXPLORATIONS SUCCESS: 5'
            ),
            job_run_result.JobRunResult.as_stderr(
                'Version history for exploration with ID %s was not '
                'created correctly' % (self.EXP_ID_1)
            ),
            job_run_result.JobRunResult.as_stderr(
                'Version history for exploration with ID %s was not '
                'created correctly' % (self.EXP_ID_2)
            ),
            job_run_result.JobRunResult.as_stderr(
                'Version history for exploration with ID %s was not '
                'created correctly' % ('3')
            ),
            job_run_result.JobRunResult.as_stderr(
                'Version history for exploration with ID %s was not '
                'created correctly' % ('4')
            ),
            job_run_result.JobRunResult.as_stderr(
                'Version history for exploration with ID %s was not '
                'created correctly' % ('5')
            )
        ])

    def test_with_corrupted_snapshot_model(self) -> None:
        assert self.user_1_id is not None
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)

        snapshot_class = exp_models.ExplorationSnapshotContentModel
        snapshot_model = snapshot_class.get('%s%s%s' % (self.EXP_ID_1, '-', 1))
        snapshot_model.content = None
        snapshot_model.update_timestamps()
        snapshot_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                'ALL EXPLORATIONS SUCCESS: 1'
            )
        ])

    def test_ignore_changes_in_deprecated_properties(self) -> None:
        assert self.user_1_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')
        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                exp_models.ExplorationModel.get_snapshot_id(
                    self.EXP_ID_1, 2
                )
            )
        )
        snapshot_metadata_model.commit_cmds.append({
            'cmd': 'edit_state_property',
            'state_name': 'A new state',
            'property_name': 'fallbacks',
            'new_value': 'foo',
        })
        snapshot_metadata_model.update_timestamps()
        snapshot_metadata_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                'ALL EXPLORATIONS SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                'VERIFIED EXPLORATIONS SUCCESS: 1'
            )
        ])


class DeleteExplorationVersionHistoryModelsJobTest(
    test_utils.GenericTestBase, job_test_utils.JobTestBase
):
    """Unit tests for DeleteExplorationVersionHistoryModelsJob."""

    JOB_CLASS = (
        exp_version_history_computation_job.
            DeleteExplorationVersionHistoryModelsJob
    )

    USER_1_EMAIL = 'user1@example.com'
    USER_1_USERNAME = 'user1'
    EXP_ID_1 = 'exp_1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = user_services.get_user_id_from_username(
            self.USER_1_USERNAME
        )

    def test_with_no_vh_models(self) -> None:
        self.assert_job_output_is_empty()

    def test_with_vh_models(self) -> None:
        assert self.user_1_id is not None
        exp = self.save_new_valid_exploration(self.EXP_ID_1, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        exp_services.update_exploration(self.user_1_id, self.EXP_ID_1, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'A new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ], 'A commit messages.')

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('SUCCESS: 2')
        ])
