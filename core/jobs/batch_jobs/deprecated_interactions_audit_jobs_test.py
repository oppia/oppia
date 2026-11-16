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

"""Unit tests for jobs.batch_jobs.deprecated_interactions_audit_jobs."""

from __future__ import annotations

from core.constants import constants
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import deprecated_interactions_audit_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Any, Dict, Final, List, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, user_models

(exp_models, user_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER]
)


class AuditDeprecatedInteractionsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        deprecated_interactions_audit_jobs.AuditDeprecatedInteractionsJob
    ] = deprecated_interactions_audit_jobs.AuditDeprecatedInteractionsJob

    EXP_1_ID: Final = 'exp_1'
    EXP_2_ID: Final = 'exp_2'
    USER_1_ID: Final = 'user_1'
    USER_2_ID: Final = 'user_2'

    def _create_exp_model(
        self,
        exp_id: str,
        title: str,
        states: Dict[str, Any],
    ) -> exp_models.ExplorationModel:
        """Helper method to create an ExplorationModel."""
        return self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title=title,
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='Introduction',
            states_schema_version=48,
            states=states,
            next_content_id_index=len(states) * 2,
        )

    def _create_rights_model(
        self,
        exp_id: str,
        owner_ids: List[str],
        editor_ids: List[str],
        community_owned: bool = False,
    ) -> exp_models.ExplorationRightsModel:
        """Helper method to create an ExplorationRightsModel."""
        return self.create_model(
            exp_models.ExplorationRightsModel,
            id=exp_id,
            owner_ids=owner_ids,
            editor_ids=editor_ids,
            community_owned=community_owned,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0,
        )

    def _create_user_model(
        self,
        user_id: str,
        username: str,
        email: str,
    ) -> user_models.UserSettingsModel:
        """Helper method to create a UserSettingsModel."""
        return self.create_model(
            user_models.UserSettingsModel,
            id=user_id,
            username=username,
            email=email,
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_exploration_without_deprecated_interactions(self) -> None:
        state = state_domain.State.create_default_state(
            'Introduction',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state['interaction']['id'] = 'TextInput'

        exp = self._create_exp_model(
            self.EXP_1_ID, 'Title 1', {'Introduction': state}
        )
        rights = self._create_rights_model(self.EXP_1_ID, [self.USER_1_ID], [])
        user = self._create_user_model(
            self.USER_1_ID, 'user1', 'user1@example.com'
        )

        self.put_multi([exp, rights, user])
        self.assert_job_output_is_empty()

    def test_exploration_with_deprecated_interaction_and_owner(self) -> None:
        state = state_domain.State.create_default_state(
            'Introduction',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state['interaction']['id'] = 'CodeRepl'

        exp = self._create_exp_model(
            self.EXP_1_ID, 'Title 1', {'Introduction': state}
        )
        rights = self._create_rights_model(self.EXP_1_ID, [self.USER_1_ID], [])
        user = self._create_user_model(
            self.USER_1_ID, 'user1', 'user1@example.com'
        )

        self.put_multi([exp, rights, user])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'User: user1, Email: user1@example.com, '
                    f'User ID: {self.USER_1_ID}, Affected Explorations: '
                    f"[('{self.EXP_1_ID}', 'Title 1', ['CodeRepl'])]"
                )
            ]
        )

    def test_multiple_explorations_grouped_for_same_user(self) -> None:
        state_1 = state_domain.State.create_default_state(
            'Introduction',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state_1['interaction']['id'] = 'CodeRepl'

        state_2 = state_domain.State.create_default_state(
            'Introduction',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state_2['interaction']['id'] = 'MusicNotesInput'

        exp_1 = self._create_exp_model(
            self.EXP_1_ID, 'Title 1', {'Introduction': state_1}
        )
        exp_2 = self._create_exp_model(
            self.EXP_2_ID, 'Title 2', {'Introduction': state_2}
        )

        rights_1 = self._create_rights_model(
            self.EXP_1_ID, [self.USER_1_ID], []
        )
        rights_2 = self._create_rights_model(
            self.EXP_2_ID, [], [self.USER_1_ID]
        )
        user = self._create_user_model(
            self.USER_1_ID, 'user1', 'user1@example.com'
        )

        self.put_multi([exp_1, exp_2, rights_1, rights_2, user])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'User: user1, Email: user1@example.com, '
                    f'User ID: {self.USER_1_ID}, Affected Explorations: '
                    f"[('{self.EXP_1_ID}', 'Title 1', ['CodeRepl']), "
                    f"('{self.EXP_2_ID}', 'Title 2', ['MusicNotesInput'])]"
                )
            ]
        )

    def test_exploration_with_multiple_owners_and_editors(self) -> None:
        state = state_domain.State.create_default_state(
            'Introduction',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state['interaction']['id'] = 'GraphInput'

        exp = self._create_exp_model(
            self.EXP_1_ID, 'Title 1', {'Introduction': state}
        )
        rights = self._create_rights_model(
            self.EXP_1_ID, [self.USER_1_ID], [self.USER_2_ID]
        )
        user_1 = self._create_user_model(
            self.USER_1_ID, 'user1', 'user1@example.com'
        )
        user_2 = self._create_user_model(
            self.USER_2_ID, 'user2', 'user2@example.com'
        )

        self.put_multi([exp, rights, user_1, user_2])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'User: user1, Email: user1@example.com, '
                    f'User ID: {self.USER_1_ID}, Affected Explorations: '
                    f"[('{self.EXP_1_ID}', 'Title 1', ['GraphInput'])]"
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'User: user2, Email: user2@example.com, '
                    f'User ID: {self.USER_2_ID}, Affected Explorations: '
                    f"[('{self.EXP_1_ID}', 'Title 1', ['GraphInput'])]"
                ),
            ]
        )

    def test_user_as_both_owner_and_editor_is_deduplicated(self) -> None:
        state = state_domain.State.create_default_state(
            'Introduction',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state['interaction']['id'] = 'PencilCodeEditor'

        exp = self._create_exp_model(
            self.EXP_1_ID, 'Title 1', {'Introduction': state}
        )
        rights = self._create_rights_model(
            self.EXP_1_ID, [self.USER_1_ID], [self.USER_1_ID]
        )
        user_1 = self._create_user_model(
            self.USER_1_ID, 'user1', 'user1@example.com'
        )

        self.put_multi([exp, rights, user_1])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'User: user1, Email: user1@example.com, '
                    f'User ID: {self.USER_1_ID}, Affected Explorations: '
                    f"[('{self.EXP_1_ID}', 'Title 1', ['PencilCodeEditor'])]"
                )
            ]
        )

    def test_exploration_with_missing_user_settings(self) -> None:
        state = state_domain.State.create_default_state(
            'Introduction',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state['interaction']['id'] = 'InteractiveMap'

        exp = self._create_exp_model(
            self.EXP_1_ID, 'Title 1', {'Introduction': state}
        )
        rights = self._create_rights_model(
            self.EXP_1_ID, ['deleted_user_id'], []
        )

        self.put_multi([exp, rights])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'User: UNKNOWN_USER, Email: UNKNOWN_EMAIL, '
                    f'User ID: deleted_user_id, Affected Explorations: '
                    f"[('{self.EXP_1_ID}', 'Title 1', ['InteractiveMap'])]"
                )
            ]
        )

    def test_unowned_exploration_output(self) -> None:
        state = state_domain.State.create_default_state(
            'Introduction',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state['interaction']['id'] = 'MusicNotesInput'

        exp = self._create_exp_model(
            self.EXP_1_ID, 'Title 1', {'Introduction': state}
        )
        rights = self._create_rights_model(
            self.EXP_1_ID, [], [], community_owned=True
        )

        self.put_multi([exp, rights])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Unowned Exploration: ID: {self.EXP_1_ID}, '
                    "Title: 'Title 1', Interactions: ['MusicNotesInput']"
                )
            ]
        )

    def test_exploration_with_multiple_deprecated_interactions(self) -> None:
        state_1 = state_domain.State.create_default_state(
            'State1',
            'content_0',
            'default_outcome_1',
            is_initial_state=True,
        ).to_dict()
        state_1['interaction']['id'] = 'CodeRepl'

        state_2 = state_domain.State.create_default_state(
            'State2',
            'content_2',
            'default_outcome_3',
            is_initial_state=False,
        ).to_dict()
        state_2['interaction']['id'] = 'PencilCodeEditor'

        exp = self._create_exp_model(
            self.EXP_1_ID,
            'Multi Interaction Exp',
            {'State1': state_1, 'State2': state_2},
        )
        rights = self._create_rights_model(self.EXP_1_ID, [self.USER_1_ID], [])
        user = self._create_user_model(
            self.USER_1_ID, 'user1', 'user1@example.com'
        )

        self.put_multi([exp, rights, user])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'User: user1, Email: user1@example.com, '
                    f'User ID: {self.USER_1_ID}, Affected Explorations: '
                    f"[('{self.EXP_1_ID}', 'Multi Interaction Exp', "
                    "['CodeRepl', 'PencilCodeEditor'])]"
                )
            ]
        )
