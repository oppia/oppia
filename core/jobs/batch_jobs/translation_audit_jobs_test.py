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

import unittest

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import translation_audit_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Dict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import opportunity_models, translation_models

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


class GetInvalidHtmlTagsTests(unittest.TestCase):

    def test_get_invalid_html_tags_with_unregistered_component_returns_it(
        self,
    ) -> None:
        self.assertEqual(
            translation_audit_jobs.get_invalid_html_tags(
                '<oppia-noninteractive-unknown></oppia-noninteractive-unknown>'
            ),
            ['oppia-noninteractive-unknown'],
        )

    def test_get_invalid_html_tags_with_invalid_tags_returns_sorted_tags(
        self,
    ) -> None:
        self.assertEqual(
            translation_audit_jobs.get_invalid_html_tags(
                '<div><p>Hello</p></div><div><b>Bold</b> <i>x</i></div>'
            ),
            ['b', 'div', 'i'],
        )


class AuditInvalidHtmlTagsInTranslationsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = translation_audit_jobs.AuditInvalidHtmlTagsInTranslationsJob

    def _create_translation_model(
        self,
        entity_id: str,
        entity_version: int,
        language_code: str,
        translations: Dict[str, feconf.TranslatedContentDict],
        entity_type: str = 'exploration',
    ) -> None:
        """Creates an EntityTranslationsModel with the given parameters."""
        model = translation_models.EntityTranslationsModel.create_new(
            entity_type,
            entity_id,
            entity_version,
            language_code,
            translations,
        )
        model.update_timestamps()
        model.put()

    def _create_html_translation(
        self, content_value: str
    ) -> feconf.TranslatedContentDict:
        """Returns an HTML TranslatedContentDict with the given value."""
        return {
            'content_value': content_value,
            'content_format': 'html',
            'needs_update': False,
        }

    def test_run_with_empty_storage_reports_zero_counts(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS SCANNED: 0'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS WITH INVALID HTML TAGS: 0'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ENTITIES WITH INVALID HTML TAGS IN TRANSLATIONS: 0'
                ),
            ]
        )

    def test_run_with_only_valid_translations_reports_zero_counts(
        self,
    ) -> None:
        self._create_translation_model(
            'exp_1',
            1,
            'pt',
            {
                'content_0': self._create_html_translation(
                    '<h1>Ola</h1><p><span>Ola</span> <em>mundo</em></p>'
                ),
                'content_1': self._create_html_translation(
                    '<p><oppia-noninteractive-skillreview '
                    'skill_id-with-value="&amp;quot;s&amp;quot;" '
                    'text-with-value="&amp;quot;t&amp;quot;">'
                    '</oppia-noninteractive-skillreview></p>'
                ),
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS SCANNED: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS WITH INVALID HTML TAGS: 0'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ENTITIES WITH INVALID HTML TAGS IN TRANSLATIONS: 0'
                ),
            ]
        )

    def test_run_with_non_html_translation_ignores_its_content(self) -> None:
        # Unicode content is plain text, so tag-like text in it is not
        # rendered as HTML.
        self._create_translation_model(
            'exp_1',
            1,
            'pt',
            {
                'ca_placeholder_0': {
                    'content_value': '<div>Not HTML</div>',
                    'content_format': 'unicode',
                    'needs_update': False,
                },
                'rule_input_1': {
                    'content_value': ['<div>a</div>'],
                    'content_format': 'set_of_normalized_string',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS SCANNED: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS WITH INVALID HTML TAGS: 0'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ENTITIES WITH INVALID HTML TAGS IN TRANSLATIONS: 0'
                ),
            ]
        )

    def test_run_with_invalid_translation_reports_it(self) -> None:
        self._create_translation_model(
            'exp_1',
            1,
            'pt',
            {
                'content_65': self._create_html_translation(
                    '<div><p>Ola</p></div>'
                ),
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS SCANNED: 1'
                ),
                job_run_result.JobRunResult.as_stderr(
                    'Invalid HTML tags in exploration exp_1 version 1 (pt): '
                    'content_65: div'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS WITH INVALID HTML TAGS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ENTITIES WITH INVALID HTML TAGS IN TRANSLATIONS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATIONS CONTAINING <div>: 1'
                ),
            ]
        )

    def test_run_with_invalid_tags_only_in_older_version_reports_zero_counts(
        self,
    ) -> None:
        self._create_translation_model(
            'exp_1',
            1,
            'pt',
            {'content_0': self._create_html_translation('<div>Old</div>')},
        )
        self._create_translation_model(
            'exp_1',
            2,
            'pt',
            {'content_0': self._create_html_translation('<p>Fixed</p>')},
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS SCANNED: 2'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS WITH INVALID HTML TAGS: 0'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ENTITIES WITH INVALID HTML TAGS IN TRANSLATIONS: 0'
                ),
            ]
        )

    def test_run_with_invalid_tags_in_many_versions_reports_only_latest(
        self,
    ) -> None:
        self._create_translation_model(
            'exp_1',
            1,
            'pt',
            {'content_0': self._create_html_translation('<div>Old</div>')},
        )
        self._create_translation_model(
            'exp_1',
            2,
            'pt',
            {'content_0': self._create_html_translation('<div>New</div>')},
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS SCANNED: 2'
                ),
                job_run_result.JobRunResult.as_stderr(
                    'Invalid HTML tags in exploration exp_1 version 2 (pt): '
                    'content_0: div'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS WITH INVALID HTML TAGS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ENTITIES WITH INVALID HTML TAGS IN TRANSLATIONS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATIONS CONTAINING <div>: 1'
                ),
            ]
        )

    def test_run_with_mixed_translations_reports_only_invalid_ones(
        self,
    ) -> None:
        # Two languages of the same exploration, which count as one
        # affected entity.
        self._create_translation_model(
            'exp_1',
            1,
            'pt',
            {
                'content_0': self._create_html_translation('<p>Valid</p>'),
                'content_1': self._create_html_translation(
                    '<div>Invalid</div>'
                ),
                'content_2': self._create_html_translation(
                    '<div><b>Invalid</b></div>'
                ),
            },
        )
        self._create_translation_model(
            'exp_1',
            1,
            'hi',
            {
                'content_1': self._create_html_translation(
                    '<p><i>Invalid</i></p>'
                ),
            },
        )
        self._create_translation_model(
            'exp_2',
            1,
            'pt',
            {'content_0': self._create_html_translation('<p>Valid</p>')},
        )
        self._create_translation_model(
            'question_1',
            1,
            'pt',
            {
                'content_0': self._create_html_translation(
                    '<div>Invalid</div>'
                ),
            },
            entity_type='question',
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS SCANNED: 4'
                ),
                job_run_result.JobRunResult.as_stderr(
                    'Invalid HTML tags in exploration exp_1 version 1 (pt): '
                    'content_1: div; content_2: b, div'
                ),
                job_run_result.JobRunResult.as_stderr(
                    'Invalid HTML tags in exploration exp_1 version 1 (hi): '
                    'content_1: i'
                ),
                job_run_result.JobRunResult.as_stderr(
                    'Invalid HTML tags in question question_1 version 1 (pt): '
                    'content_0: div'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS WITH INVALID HTML TAGS: 3'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ENTITIES WITH INVALID HTML TAGS IN TRANSLATIONS: 2'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATIONS CONTAINING <div>: 3'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATIONS CONTAINING <b>: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TRANSLATIONS CONTAINING <i>: 1'
                ),
            ]
        )
