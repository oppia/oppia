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

"""Unit tests for jobs.batch_jobs.translation_audit_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import translation_audit_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, opportunity_models, translation_models) = (
    models.Registry.import_models(
        [
            models.Names.EXPLORATION,
            models.Names.OPPORTUNITY,
            models.Names.TRANSLATION,
        ]
    )
)


class ValidateExplorationOpportunityCountsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = translation_audit_jobs.ValidateExplorationOpportunityCountsJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_matches_exactly(self) -> None:
        exp_id = 'exp_1'
        summary_model = opportunity_models.ExplorationOpportunitySummaryModel(
            id=exp_id,
            topic_id='topic1',
            topic_name='Topic 1',
            story_id='story_1',
            story_title='Story 1',
            chapter_title='Chapter 1',
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5, 'es': 10},
            language_codes_needing_voice_artists=[],
            language_codes_with_assigned_voice_artists=[],
        )
        summary_model.update_timestamps()
        summary_model.put()

        translation_1 = translation_models.EntityTranslationsModel(
            id='exploration-exp_1-1-hi',
            entity_id=exp_id,
            entity_type='exploration',
            entity_version=1,
            language_code='hi',
            translations={f'content_{i}': {} for i in range(5)},
        )
        translation_1.update_timestamps()
        translation_1.put()

        translation_2 = translation_models.EntityTranslationsModel(
            id='exploration-exp_1-1-es',
            entity_id=exp_id,
            entity_type='exploration',
            entity_version=1,
            language_code='es',
            translations={f'content_{i}': {} for i in range(10)},
        )
        translation_2.update_timestamps()
        translation_2.put()

        exp_1 = exp_models.ExplorationModel(
            id=exp_id,
            title='Title',
            init_state_name='abc',
            category='category',
            objective='objective',
            language_code='en',
            tags=[],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=45,
            states={'abc': {}},
        )
        exp_models.ExplorationModel.update_timestamps_multi([exp_1])
        exp_models.ExplorationModel.put_multi([exp_1])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'SUCCESS - Exploration {exp_id} counts are valid.'
                )
            ]
        )

    def test_mismatch(self) -> None:
        exp_id = 'exp_2'
        summary_model_2 = opportunity_models.ExplorationOpportunitySummaryModel(
            id=exp_id,
            topic_id='topic1',
            topic_name='Topic 1',
            story_id='story_1',
            story_title='Story 1',
            chapter_title='Chapter 1',
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 6},
            language_codes_needing_voice_artists=[],
            language_codes_with_assigned_voice_artists=[],
        )
        summary_model_2.update_timestamps()
        summary_model_2.put()

        translation_1_mock = translation_models.EntityTranslationsModel(
            id='exploration-exp_2-1-hi',
            entity_id=exp_id,
            entity_type='exploration',
            entity_version=1,
            language_code='hi',
            translations={f'content_{i}': {} for i in range(4)},
        )
        translation_1_mock.update_timestamps()
        translation_1_mock.put()

        exp_2 = exp_models.ExplorationModel(
            id=exp_id,
            title='Title 2',
            init_state_name='abc',
            category='category',
            objective='objective',
            language_code='en',
            tags=[],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=45,
            states={'abc': {}},
        )
        exp_models.ExplorationModel.update_timestamps_multi([exp_2])
        exp_models.ExplorationModel.put_multi([exp_2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    f'Mismatch for exploration {exp_id} in hi: stored=6, actual=4'
                )
            ]
        )
