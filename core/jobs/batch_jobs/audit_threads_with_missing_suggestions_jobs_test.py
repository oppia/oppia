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

"""Unit tests for audit_threads_with_missing_suggestions_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import audit_threads_with_missing_suggestions_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models, suggestion_models

(feedback_models, suggestion_models) = models.Registry.import_models(
    [
        models.Names.FEEDBACK,
        models.Names.SUGGESTION,
    ]
)


class AuditThreadsWithMissingSuggestionsJobTest(job_test_utils.JobTestBase):
    """Tests for AuditThreadsWithMissingSuggestionsJob."""

    JOB_CLASS: Type[
        audit_threads_with_missing_suggestions_jobs.AuditThreadsWithMissingSuggestionsJob
    ] = (
        audit_threads_with_missing_suggestions_jobs.AuditThreadsWithMissingSuggestionsJob
    )

    def test_empty_datastore(self) -> None:
        self.assert_job_output_is([])

    def test_thread_with_valid_suggestion(self) -> None:
        thread = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='exploration.exp1.thread1',
            entity_type='exploration',
            entity_id='exp1',
            status='open',
            subject='subject',
            message_count=1,
            has_suggestion=True,
            deleted=False,
        )

        suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=thread.id,
            suggestion_type=feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            target_type='exploration',
            target_id='exp1',
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='user1',
            final_reviewer_id=None,
            score_category='content',
            change_cmd={
                'cmd': 'edit_state_property',
                'state_name': 'Introduction',
                'property_name': 'content',
                'new_value': {
                    'html': '<p>Updated</p>',
                    'content_id': 'content',
                },
            },
            deleted=False,
        )

        self.put_multi([thread, suggestion])

        self.assert_job_output_is([])

    def test_thread_missing_suggestion(self) -> None:
        thread = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='exploration.exp1.thread_missing',
            entity_type='exploration',
            entity_id='exp1',
            status='open',
            subject='subject',
            message_count=1,
            has_suggestion=True,
            deleted=False,
        )

        self.put_multi([thread])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'GeneralFeedbackThreadModel marked as has_suggestion=True '
                        'but no GeneralSuggestionModel exists: '
                        f'id={thread.id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'invalid_feedback_thread_models_count: 1'
                ),
            ]
        )

    def test_thread_when_suggestion_flag_is_false(self) -> None:
        thread = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='exploration.exp1.thread_no_flag',
            entity_type='exploration',
            entity_id='exp1',
            status='open',
            subject='subject',
            message_count=1,
            has_suggestion=False,
            deleted=False,
        )

        self.put_multi([thread])

        self.assert_job_output_is([])


class FixThreadsWithMissingSuggestionsJobTest(job_test_utils.JobTestBase):
    """Tests for FixThreadsWithMissingSuggestionsJob."""

    JOB_CLASS: Type[
        audit_threads_with_missing_suggestions_jobs.FixThreadsWithMissingSuggestionsJob
    ] = (
        audit_threads_with_missing_suggestions_jobs.FixThreadsWithMissingSuggestionsJob
    )

    def test_fix_unsets_has_suggestion_flag(self) -> None:
        invalid_thread = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='exploration.exp1.thread_missing',
            entity_type='exploration',
            entity_id='exp1',
            status='open',
            subject='subject',
            message_count=1,
            has_suggestion=True,
            deleted=False,
        )

        self.put_multi([invalid_thread])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Fixed GeneralFeedbackThreadModel by setting '
                        f'has_suggestion=False: id={invalid_thread.id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'fixed_feedback_thread_models_count: 1'
                ),
            ]
        )

        updated_thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(
            invalid_thread.id
        )
        self.assertIsNotNone(updated_thread)
        self.assertFalse(updated_thread.has_suggestion)

    def test_valid_thread_is_not_modified(self) -> None:
        valid_thread = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='exploration.exp1.thread_valid',
            entity_type='exploration',
            entity_id='exp1',
            status='open',
            subject='subject',
            message_count=1,
            has_suggestion=True,
            deleted=False,
        )

        suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=valid_thread.id,
            suggestion_type=feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            target_type='exploration',
            target_id='exp1',
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='user1',
            final_reviewer_id=None,
            score_category='content',
            change_cmd={
                'cmd': 'edit_state_property',
                'state_name': 'Introduction',
                'property_name': 'content',
                'new_value': {
                    'html': '<p>Updated</p>',
                    'content_id': 'content',
                },
            },
            deleted=False,
        )

        self.put_multi([valid_thread, suggestion])

        self.assert_job_output_is([])

        unchanged_thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(
            valid_thread.id
        )
        self.assertTrue(unchanged_thread.has_suggestion)
