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

(opportunity_models, translation_models) = models.Registry.import_models(
    [
        models.Names.OPPORTUNITY,
        models.Names.TRANSLATION,
    ]
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
            translations={'content_%d' % i: {} for i in range(5)},
        )
        translation_1.update_timestamps()
        translation_1.put()

        translation_2 = translation_models.EntityTranslationsModel(
            id='exploration-exp_1-1-es',
            entity_id=exp_id,
            entity_type='exploration',
            entity_version=1,
            language_code='es',
            translations={'content_%d' % i: {} for i in range(10)},
        )
        translation_2.update_timestamps()
        translation_2.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'SUCCESS - Exploration %s counts are valid.' % exp_id
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
            translations={'content_%d' % i: {} for i in range(4)},
        )
        translation_1_mock.update_timestamps()
        translation_1_mock.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    'Mismatch for exploration %s in hi: '
                    'stored=6, actual=4' % exp_id
                )
            ]
        )

    def test_no_opportunity_summary_for_translation(self) -> None:
        """Test that translations without a corresponding opportunity summary
        produce no output.
        """
        exp_id = 'exp_no_summary'
        translation_model = translation_models.EntityTranslationsModel(
            id='exploration-%s-1-hi' % exp_id,
            entity_id=exp_id,
            entity_type='exploration',
            entity_version=1,
            language_code='hi',
            translations={'content_0': {}, 'content_1': {}},
        )
        translation_model.update_timestamps()
        translation_model.put()

        self.assert_job_output_is_empty()

    def test_mismatch_language_in_translations_but_not_in_summary(
        self,
    ) -> None:
        """Test that a language present in EntityTranslationsModel but missing
        from the opportunity summary's translation_counts is reported as a
        mismatch.
        """
        exp_id = 'exp_extra_lang'
        summary_model = opportunity_models.ExplorationOpportunitySummaryModel(
            id=exp_id,
            topic_id='topic1',
            topic_name='Topic 1',
            story_id='story_1',
            story_title='Story 1',
            chapter_title='Chapter 1',
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 3},
            language_codes_needing_voice_artists=[],
            language_codes_with_assigned_voice_artists=[],
        )
        summary_model.update_timestamps()
        summary_model.put()

        translation_hi = translation_models.EntityTranslationsModel(
            id='exploration-%s-1-hi' % exp_id,
            entity_id=exp_id,
            entity_type='exploration',
            entity_version=1,
            language_code='hi',
            translations={'content_%d' % i: {} for i in range(3)},
        )
        translation_hi.update_timestamps()
        translation_hi.put()

        # 'es' translations exist but are not in the summary's
        # translation_counts.
        translation_es = translation_models.EntityTranslationsModel(
            id='exploration-%s-1-es' % exp_id,
            entity_id=exp_id,
            entity_type='exploration',
            entity_version=1,
            language_code='es',
            translations={'content_0': {}, 'content_1': {}},
        )
        translation_es.update_timestamps()
        translation_es.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    'Mismatch for exploration %s in es: '
                    'stored=0 (missing), actual=2' % exp_id
                )
            ]
        )
