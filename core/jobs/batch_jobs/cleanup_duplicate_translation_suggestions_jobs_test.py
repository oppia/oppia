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

"""Unit tests for cleanup_duplicate_translation_suggestions_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import cleanup_duplicate_translation_suggestions_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models,) = models.Registry.import_models([models.Names.SUGGESTION])


class AuditDuplicateTranslationSuggestionsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = (
        cleanup_duplicate_translation_suggestions_jobs.AuditDuplicateTranslationSuggestionsJob
    )

    def test_empty_datastore_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_no_duplicates_returns_empty_report(self) -> None:
        suggestion1 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion1',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd={'content_id': 'content1'},
            score_category='translation.category',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id='exp1',
            target_version_at_submission=1,
            language_code='hi',
        )
        suggestion2 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion2',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user2',
            change_cmd={'content_id': 'content2'},
            score_category='translation.category',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id='exp1',
            target_version_at_submission=1,
            language_code='hi',
        )
        self.put_multi([suggestion1, suggestion2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TOTAL SUGGESTIONS COUNT SUCCESS: 2'
                ),
            ]
        )

    def test_duplicates_are_reported(self) -> None:
        suggestion1 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion1',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            status=suggestion_models.STATUS_IN_REVIEW,
            target_id='exp1',
            language_code='hi',
            change_cmd={'content_id': 'content1'},
            author_id='user1',
            score_category='translation.category',
            target_type='exploration',
            target_version_at_submission=1,
        )
        suggestion2 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion2',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            status=suggestion_models.STATUS_IN_REVIEW,
            target_id='exp1',
            language_code='hi',
            change_cmd={'content_id': 'content1'},
            author_id='user2',
            score_category='translation.category',
            target_type='exploration',
            target_version_at_submission=1,
        )
        self.put_multi([suggestion1, suggestion2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='DUPLICATE GROUPS COUNT SUCCESS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Duplicates found for exploration exp1, language hi, '
                    'content_id content1. Suggestion IDs: [\'suggestion1\', \'suggestion2\']'
                ),
                job_run_result.JobRunResult(
                    stdout='REJECTED DUPLICATE SUGGESTIONS COUNT SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TOTAL SUGGESTIONS COUNT SUCCESS: 2'
                ),
            ]
        )


class CleanupDuplicateTranslationSuggestionsJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        cleanup_duplicate_translation_suggestions_jobs.CleanupDuplicateTranslationSuggestionsJob
    )

    def test_empty_datastore_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_no_duplicates_leaves_suggestions_unchanged(self) -> None:
        suggestion1 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion1',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd={'content_id': 'content1'},
            score_category='translation.category',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id='exp1',
            target_version_at_submission=1,
            language_code='hi',
        )
        self.put_multi([suggestion1])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TOTAL SUGGESTIONS COUNT SUCCESS: 1'
                ),
            ]
        )

        model1 = suggestion_models.GeneralSuggestionModel.get_by_id(
            'suggestion1'
        )
        self.assertEqual(model1.status, suggestion_models.STATUS_IN_REVIEW)

    def test_duplicates_are_cleaned_up(self) -> None:
        # Created 1 hour ago.
        created_on_1 = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        # Created 2 hours ago (oldest).
        created_on_2 = datetime.datetime.utcnow() - datetime.timedelta(hours=2)

        suggestion1 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion1',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            status=suggestion_models.STATUS_IN_REVIEW,
            target_id='exp1',
            language_code='hi',
            change_cmd={'content_id': 'content1'},
            author_id='user1',
            score_category='translation.category',
            target_type='exploration',
            target_version_at_submission=1,
            created_on=created_on_1,
        )
        suggestion2 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion2',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            status=suggestion_models.STATUS_IN_REVIEW,
            target_id='exp1',
            language_code='hi',
            change_cmd={'content_id': 'content1'},
            author_id='user2',
            score_category='translation.category',
            target_type='exploration',
            target_version_at_submission=1,
            created_on=created_on_2,
        )
        self.put_multi([suggestion1, suggestion2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='DUPLICATE GROUPS COUNT SUCCESS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Duplicates found for exploration exp1, language hi, '
                    'content_id content1. Suggestion IDs: [\'suggestion1\', \'suggestion2\']'
                ),
                job_run_result.JobRunResult(
                    stdout='REJECTED DUPLICATE SUGGESTIONS COUNT SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TOTAL SUGGESTIONS COUNT SUCCESS: 2'
                ),
            ]
        )

        # Suggestion 2 should still be in review (it was the oldest).
        model2 = suggestion_models.GeneralSuggestionModel.get_by_id(
            'suggestion2'
        )
        self.assertEqual(model2.status, suggestion_models.STATUS_IN_REVIEW)

        # Suggestion 1 should be rejected.
        model1 = suggestion_models.GeneralSuggestionModel.get_by_id(
            'suggestion1'
        )
        self.assertEqual(model1.status, suggestion_models.STATUS_REJECTED)
        self.assertEqual(
            model1.final_reviewer_id, feconf.SUGGESTION_BOT_USER_ID
        )
