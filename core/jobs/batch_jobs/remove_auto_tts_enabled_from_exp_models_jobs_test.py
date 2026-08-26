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

"""Tests for remove_auto_tts_enabled_from_exp_models_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import remove_auto_tts_enabled_from_exp_models_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])

datastore_services = models.Registry.import_datastore_services()


class MockExplorationModelWithAutoTts(exp_models.ExplorationModel):
    """Mock ExplorationModel so that it allows to set auto_tts_enabled."""

    auto_tts_enabled = datastore_services.BooleanProperty(
        default=True, indexed=True
    )


class MockExplorationSnapshotContentModelWithAutoTts(
    exp_models.ExplorationSnapshotContentModel
):
    """Mock ExplorationSnapshotContentModel."""

    pass


class RemoveAutoTtsEnabledFieldJobTests(job_test_utils.JobTestBase):
    """Tests for remove_auto_tts_enabled_from_exp_models_jobs."""

    JOB_CLASS = (
        remove_auto_tts_enabled_from_exp_models_jobs.RemoveAutoTtsEnabledFieldJob
    )

    def setUp(self) -> None:
        super().setUp()
        self.exp_1 = self.create_model(
            MockExplorationModelWithAutoTts,
            id='exp_1',
            title='exploration title',
            category='category',
            objective='objective',
            language_code='en',
            tags=[],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=48,
            init_state_name='Introduction',
            states={},
            param_specs={},
            param_changes=[],
            auto_tts_enabled=True,
            correctness_feedback_enabled=False,
            edits_allowed=True,
        )

        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id='exp_2',
            title='exploration title',
            category='category',
            objective='objective',
            language_code='en',
            tags=[],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=48,
            init_state_name='Introduction',
            states={},
            param_specs={},
            param_changes=[],
            correctness_feedback_enabled=False,
            edits_allowed=True,
        )
        if (
            'auto_tts_enabled'
            in self.exp_2._properties  # pylint: disable=protected-access
        ):
            del self.exp_2._properties[  # pylint: disable=protected-access
                'auto_tts_enabled'
            ]

        self.snapshot_1 = self.create_model(
            MockExplorationSnapshotContentModelWithAutoTts,
            id='exp_1-1',
            content={'auto_tts_enabled': True, 'title': 'title1'},
        )

        self.snapshot_2 = self.create_model(
            exp_models.ExplorationSnapshotContentModel,
            id='exp_2-1',
            content={'title': 'title2'},
        )

        self.put_multi(
            [self.exp_1, self.exp_2, self.snapshot_1, self.snapshot_2]
        )

    def test_job_removes_auto_tts_enabled_field(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MODELS ITERATED OR UPDATED SUCCESS: 2'
                ),
                job_run_result.JobRunResult(
                    stdout='SNAPSHOT MODELS ITERATED OR UPDATED SUCCESS: 2'
                ),
            ]
        )

        exp_1_model = exp_models.ExplorationModel.get('exp_1')
        self.assertFalse(
            'auto_tts_enabled'
            in exp_1_model._properties  # pylint: disable=protected-access
        )

        exp_2_model = exp_models.ExplorationModel.get('exp_2')
        self.assertFalse(
            'auto_tts_enabled'
            in exp_2_model._properties  # pylint: disable=protected-access
        )

        snapshot_1_model = exp_models.ExplorationSnapshotContentModel.get(
            'exp_1-1'
        )
        self.assertFalse('auto_tts_enabled' in snapshot_1_model.content)

        snapshot_2_model = exp_models.ExplorationSnapshotContentModel.get(
            'exp_2-1'
        )
        self.assertFalse('auto_tts_enabled' in snapshot_2_model.content)
