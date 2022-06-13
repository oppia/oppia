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

"""Unit tests for jobs.batch_jobs.exp_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class MigrateExplorationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = exp_migration_jobs.MigrateExplorationJob

    NEW_EXP_ID = 'exp_1'
    EXP_TITLE = 'title'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrated_exp_is_not_migrated(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)

        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1')
        ])

        exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(exp_model.version, 1)
        exp_services.delete_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp_model.id)

    def test_broken_cache_is_reported(self) -> None:
        cache_swap = self.swap_to_always_raise(
            caching_services, 'delete_multi', Exception('cache deletion error')
        )

        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        swap_exp_schema_53 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 53)

        with swap_states_schema_48, swap_exp_schema_53:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)

            self.assertEqual(exploration.states_schema_version, 48)

        with cache_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='CACHE DELETION ERROR: "cache deletion error": 1'),
                job_run_result.JobRunResult(
                    stdout='EXP MIGRATED SUCCESS: 1', stderr='')
            ])

        migrated_exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(
            migrated_exp_model.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_unmigrated_exp_is_migrated(self) -> None:
        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        swap_exp_schema_53 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 53)

        with swap_states_schema_48, swap_exp_schema_53:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)

            self.assertEqual(exploration.states_schema_version, 48)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='CACHE DELETION SUCCESS: 1', stderr=''),
            job_run_result.JobRunResult(
                stdout='EXP MIGRATED SUCCESS: 1', stderr='')
        ])

        exp_services.delete_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.NEW_EXP_ID)
