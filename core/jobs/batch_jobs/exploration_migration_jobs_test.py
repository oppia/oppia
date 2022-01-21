# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.exploration_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import caching_services
from core.domain import exp_domain
from core.domain import rights_domain
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exploration_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class MigrateExplorationJobTests(job_test_utils.JobTestBase):

    EXP_1_ID = 'exp_1_id'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_COMMITTER = 'id_committer'

    JOB_CLASS = exploration_migration_jobs.MigrateExplorationJob

    def setUp(self):
        super().setUp()
        exp_summary_model = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_1_ID,
            deleted=False,
            title='title',
            category='category',
            objective='objective',
            language_code='en',
            ratings=feconf.get_empty_ratings(),
            scaled_average_rating=feconf.EMPTY_SCALED_AVERAGE_RATING,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            community_owned=False,
            owner_ids=[self.USER_ID_1],
            contributor_ids=[],
            contributors_summary={},
            version=1
        )
        exp_summary_model.update_timestamps()
        exp_summary_model.put()

        exp_models.ExplorationRightsModel(
            id=self.EXP_1_ID,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_2],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.1
        ).save(
            self.USER_ID_COMMITTER, 'Created new exploration right',
            [{'cmd': rights_domain.CMD_CREATE_NEW}])

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_broken_cache_is_reported(self) -> None:
        cache_swap = self.swap_to_always_raise(
            caching_services, 'delete_multi', Exception('cache deletion error'))

        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration title',
            category='category',
            objective='objective',
            init_state_name='state',
            states_schema_version=48,
            states={
                'state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict()
            }
        )
        exp_model.update_timestamps()
        exp_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
            'cmd': exp_domain.CMD_CREATE_NEW
        }])

        with cache_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='EXPLORATION PROCESSED SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='CACHE DELETION ERROR: "cache deletion error": 1'),
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MIGRATED SUCCESS: 1'),
            ])

        migrated_exp_model = exp_models.ExplorationModel.get(self.EXP_1_ID)
        self.assertEqual(migrated_exp_model.version, 2)

    def test_unmigrated_exp_is_migrated(self) -> None:
        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration title',
            category='category',
            init_state_name='state',
            states_schema_version=48,
            states={
                'state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict()
            }
        )
        exp_model.update_timestamps()
        exp_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
            'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='EXPLORATION PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='EXPLORATION MIGRATED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='CACHE DELETION SUCCESS: 1')
        ])

        migrated_exp_model = exp_models.ExplorationModel.get(self.EXP_1_ID)
        self.assertEqual(migrated_exp_model.version, 2)
        self.assertEqual(migrated_exp_model.android_proto_size_in_bytes, 64)

    def test_broken_exploration_is_not_migrated(self) -> None:
        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration title',
            category='category',
            objective='objective',
            init_state_name='wrong_init_state_name',
            states_schema_version=48,
            states={
                'state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict()
            }
        )
        exp_model.update_timestamps()
        exp_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
            'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr='EXPLORATION PROCESSED ERROR: \'(\'exp_1_id\', ValidationError(\'There is no state in [\'state\'] corresponding to the exploration\'s initial state name wrong_init_state_name.\'))\': 1' # pylint: disable=line-too-long
            )
        ])

        migrated_exp_model = exp_models.ExplorationModel.get(self.EXP_1_ID)
        self.assertEqual(migrated_exp_model.version, 1)

    def test_migrated_exploration_is_not_migrated(self) -> None:
        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration title',
            category='category',
            objective='objective',
            init_state_name='state',
            states_schema_version=48,
            states={
                'state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict()
            },
            android_proto_size_in_bytes=64
        )
        exp_model.update_timestamps()
        exp_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
            'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='EXPLORATION PROCESSED SUCCESS: 1')
        ])

        unmigrated_exploration_model = exp_models.ExplorationModel.get(
            self.EXP_1_ID)
        self.assertEqual(unmigrated_exploration_model.version, 1)
