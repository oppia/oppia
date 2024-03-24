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

"""Unit tests for jobs.batch_jobs.suggestion_edit_state_content_deletion_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import suggestion_edit_state_content_deletion_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models, ) = models.Registry.import_models([
    models.Names.SUGGESTION
])


class DeleteDeprecatedSuggestionEditStateContentModelsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        suggestion_edit_state_content_deletion_jobs.DeleteDeprecatedSuggestionEditStateContentModelsJob
    ] = suggestion_edit_state_content_deletion_jobs.DeleteDeprecatedSuggestionEditStateContentModelsJob

    def setUp(self) -> None:
        super().setUp()


        self.suggestion_1_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type = feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            target_type = feconf.ENTITY_TYPE_EXPLORATION,
            target_id = 'target_1',
            target_version_at_submission = 1,
            status = 'accepted',
            author_id = 'author_1',
            final_reviewer_id = 'reviewer_1',
            change_cmd = {},
            score_category = (
                suggestion_models.SCORE_TYPE_TRANSLATION +
                suggestion_models.SCORE_CATEGORY_DELIMITER + 'English'),
            language_code = None
        )

        self.suggestion_2_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type = feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            target_type = feconf.ENTITY_TYPE_EXPLORATION,
            target_id = 'target_2',
            target_version_at_submission = 1,
            status = 'accepted',
            author_id = 'author_2',
            final_reviewer_id = 'reviewer_2',
            change_cmd = {},
            score_category = (
                suggestion_models.SCORE_TYPE_TRANSLATION +
                suggestion_models.SCORE_CATEGORY_DELIMITER + 'English'),
            language_code = None
        )

        self.suggestion_3_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type = feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type = feconf.ENTITY_TYPE_EXPLORATION,
            target_id = 'target_3',
            target_version_at_submission = 1,
            status = 'accepted',
            author_id = 'author_3',
            final_reviewer_id = 'reviewer_3',
            change_cmd = {},
            score_category = (
                suggestion_models.SCORE_TYPE_TRANSLATION +
                suggestion_models.SCORE_CATEGORY_DELIMITER + 'English'),
            language_code = 'hi',
            edited_by_reviewer = False
        )

        self.suggestion_4_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type = feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type = feconf.ENTITY_TYPE_EXPLORATION,
            target_id = 'target_4',
            target_version_at_submission = 1,
            status = 'accepted',
            author_id = 'author_4',
            final_reviewer_id = 'reviewer_4',
            change_cmd = {},
            score_category = (
                suggestion_models.SCORE_TYPE_TRANSLATION +
                suggestion_models.SCORE_CATEGORY_DELIMITER + 'English'),
            language_code = 'en',
            edited_by_reviewer = False
        )

    def test_job_deletes_suggestion_edit_state_content_model(self) -> None:
        self.suggestion_1_model.update_timestamps()
        self.suggestion_2_model.update_timestamps()
        self.suggestion_3_model.update_timestamps()
        self.suggestion_4_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            self.suggestion_1_model,
            self.suggestion_2_model,
            self.suggestion_3_model,
            self.suggestion_4_model])

        queries = [(
            'suggestion_type',
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)]

        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(queries)), 2)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EDIT STATE CONTENT SUGGESTION SUCCESS: 2')
        ])

        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(queries)), 0)


class AuditDeleteDeprecatedSuggestionEditStateContentModelsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        suggestion_edit_state_content_deletion_jobs.AuditDeprecatedSuggestionEditStateContentModelsDeletionJob
    ] = suggestion_edit_state_content_deletion_jobs.AuditDeprecatedSuggestionEditStateContentModelsDeletionJob

    def setUp(self) -> None:
        super().setUp()


        self.suggestion_1_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type = feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            target_type = feconf.ENTITY_TYPE_EXPLORATION,
            target_id = 'target_1',
            target_version_at_submission = 1,
            status = 'accepted',
            author_id = 'author_1',
            final_reviewer_id = 'reviewer_1',
            change_cmd = {},
            score_category = (
                suggestion_models.SCORE_TYPE_TRANSLATION +
                suggestion_models.SCORE_CATEGORY_DELIMITER + 'English'),
            language_code = None
        )

        self.suggestion_2_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type = feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            target_type = feconf.ENTITY_TYPE_EXPLORATION,
            target_id = 'target_2',
            target_version_at_submission = 1,
            status = 'accepted',
            author_id = 'author_2',
            final_reviewer_id = 'reviewer_2',
            change_cmd = {},
            score_category = (
                suggestion_models.SCORE_TYPE_TRANSLATION +
                suggestion_models.SCORE_CATEGORY_DELIMITER + 'English'),
            language_code = None
        )

        self.suggestion_3_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type = feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type = feconf.ENTITY_TYPE_EXPLORATION,
            target_id = 'target_3',
            target_version_at_submission = 1,
            status = 'accepted',
            author_id = 'author_3',
            final_reviewer_id = 'reviewer_3',
            change_cmd = {},
            score_category = (
                suggestion_models.SCORE_TYPE_TRANSLATION +
                suggestion_models.SCORE_CATEGORY_DELIMITER + 'English'),
            language_code = 'hi',
            edited_by_reviewer = False
        )

        self.suggestion_4_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type = feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type = feconf.ENTITY_TYPE_EXPLORATION,
            target_id = 'target_4',
            target_version_at_submission = 1,
            status = 'accepted',
            author_id = 'author_4',
            final_reviewer_id = 'reviewer_4',
            change_cmd = {},
            score_category = (
                suggestion_models.SCORE_TYPE_TRANSLATION +
                suggestion_models.SCORE_CATEGORY_DELIMITER + 'English'),
            language_code = 'en',
            edited_by_reviewer = False
        )

    def test_job_deletes_suggestion_edit_state_content_model(self) -> None:
        self.suggestion_1_model.update_timestamps()
        self.suggestion_2_model.update_timestamps()
        self.suggestion_3_model.update_timestamps()
        self.suggestion_4_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            self.suggestion_1_model,
            self.suggestion_2_model,
            self.suggestion_3_model,
            self.suggestion_4_model])

        queries = [(
            'suggestion_type',
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)]

        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(queries)), 2)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EDIT STATE CONTENT SUGGESTION SUCCESS: 2')
        ])

        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(queries)), 2)
