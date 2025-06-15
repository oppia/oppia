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

"""Unit tests for jobs.batch_jobs.suggestion_edit_state_content_deletion_jobs.
"""

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

suggestion_model = suggestion_models.GeneralSuggestionModel


class DeleteDeprecatedSuggestionEditStateContentModelsJobTests(
    job_test_utils.JobTestBase):

    jobs = suggestion_edit_state_content_deletion_jobs

    JOB_CLASS: Type[
        jobs.DeleteDeprecatedSuggestionEditStateContentModelsJob
    ] = jobs.DeleteDeprecatedSuggestionEditStateContentModelsJob

    def create_suggestion(
            self,
            suggestion_type: str,
            target_type: str,
            target_id: str,
            author_id: str,
            final_reviewer_id: str,
            language_code: None | str
            ) -> suggestion_model:
        """Creates new suggestion.

        Args:
            suggestion_type: str. Type of the suggestion that is being
                created.
            target_type: str. Type of traget entity for which the suggestion
                is being created.
            target_id: str. The ID of the target entity.
            author_id: str. The ID of user who creates the suggestion.
            final_reviewer_id: str. The user ID of the reviewer.
            language_code: None | str. Code of the language in which the
                suggestion is created.

        Returns:
            GeneralSuggestionModel. Returns newly created
            GeneralSuggestionModel.
        """

        return self.create_model(
            suggestion_model,
            suggestion_type=suggestion_type,
            target_type=target_type,
            target_id=target_id,
            target_version_at_submission=1,
            status='accepted',
            author_id=author_id,
            final_reviewer_id=final_reviewer_id,
            change_cmd={},
            score_category=('%s%sEnglish' % (
                suggestion_models.SCORE_TYPE_TRANSLATION,
                suggestion_models.SCORE_CATEGORY_DELIMITER
            )),
            language_code=language_code
        )

    def setUp(self) -> None:
        super().setUp()

        self.state_content_suggestion_model_1: suggestion_model = (
            self.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'target_1',
                'author_1',
                'reviewer_1',
                None
            ))

        self.state_content_suggestion_model_2: suggestion_model = (
            self.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'target_2',
                'author_2',
                'reviewer_2',
                None
            ))

        self.translation_suggestion_model: suggestion_model = (
            self.create_suggestion(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'target_3',
                'author_3',
                'reviewer_3',
                'hi'
            ))

        self.question_suggestion_model: suggestion_model = (
            self.create_suggestion(
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                feconf.ENTITY_TYPE_EXPLORATION,
                'target_4',
                'author_4',
                'reviewer_4',
                'en'
            ))

    def test_job_deletes_suggestion_edit_state_content_model(self) -> None:
        self.state_content_suggestion_model_1.update_timestamps()
        self.state_content_suggestion_model_2.update_timestamps()
        self.translation_suggestion_model.update_timestamps()
        self.question_suggestion_model.update_timestamps()
        suggestion_model.put_multi([
            self.state_content_suggestion_model_1,
            self.state_content_suggestion_model_2,
            self.translation_suggestion_model,
            self.question_suggestion_model])

        queries = [(
            'suggestion_type',
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)]

        self.assertEqual(
            len(suggestion_model.query_suggestions(queries)), 2)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='EDIT STATE CONTENT SUGGESTION SUCCESS: 2')])

        self.assertEqual(
            len(suggestion_model.query_suggestions(queries)), 0)


class AuditDeleteDeprecatedSuggestionEditStateContentModelsJobTests(
    job_test_utils.JobTestBase):

    jobs = suggestion_edit_state_content_deletion_jobs

    JOB_CLASS: Type[
        jobs.AuditDeprecatedSuggestionEditStateContentModelsDeletionJob
    ] = jobs.AuditDeprecatedSuggestionEditStateContentModelsDeletionJob

    def create_suggestion(
            self,
            suggestion_type: str,
            target_type: str,
            target_id: str,
            author_id: str,
            final_reviewer_id: str,
            language_code: None | str
            ) -> suggestion_model:
        """Creates new suggestion.

        Args:
            suggestion_type: str. Type of the suggestion that is being
                created.
            target_type: str. Type of traget entity for which the suggestion
                is being created.
            target_id: str. The ID of the target entity.
            author_id: str. The ID of user who creates the suggestion.
            final_reviewer_id: str. The user ID of the reviewer.
            language_code: None | str. Code of the language in which the
                suggestion is created.

        Returns:
            GeneralSuggestionModel. Returns newly created
            GeneralSuggestionModel.
        """

        return self.create_model(
            suggestion_model,
            suggestion_type=suggestion_type,
            target_type=target_type,
            target_id=target_id,
            target_version_at_submission=1,
            status='accepted',
            author_id=author_id,
            final_reviewer_id=final_reviewer_id,
            change_cmd={},
            score_category=('%s%sEnglish' % (
                suggestion_models.SCORE_TYPE_TRANSLATION,
                suggestion_models.SCORE_CATEGORY_DELIMITER
            )),
            language_code=language_code
        )

    def setUp(self) -> None:
        super().setUp()

        self.state_content_suggestion_model_1: suggestion_model = (
            self.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'target_1',
                'author_1',
                'reviewer_1',
                None
            ))

        self.state_content_suggestion_model_2: suggestion_model = (
            self.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'target_2',
                'author_2',
                'reviewer_2',
                None
            ))

        self.translation_suggestion_model: suggestion_model = (
            self.create_suggestion(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'target_3',
                'author_3',
                'reviewer_3',
                'hi'
            ))

        self.question_suggestion_model: suggestion_model = (
            self.create_suggestion(
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                feconf.ENTITY_TYPE_EXPLORATION,
                'target_4',
                'author_4',
                'reviewer_4',
                'en'
            ))

    def test_job_deletes_suggestion_edit_state_content_model(self) -> None:
        self.state_content_suggestion_model_1.update_timestamps()
        self.state_content_suggestion_model_2.update_timestamps()
        self.translation_suggestion_model.update_timestamps()
        self.question_suggestion_model.update_timestamps()
        suggestion_model.put_multi([
            self.state_content_suggestion_model_1,
            self.state_content_suggestion_model_2,
            self.translation_suggestion_model,
            self.question_suggestion_model])

        queries = [(
            'suggestion_type',
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)]

        self.assertEqual(
            len(suggestion_model.query_suggestions(queries)), 2)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='EDIT STATE CONTENT SUGGESTION SUCCESS: 2')])

        self.assertEqual(
            len(suggestion_model.query_suggestions(queries)), 2)
