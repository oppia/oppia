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

"""Unit tests for jobs.batch_jobs.classroom_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import classroom_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import classroom_models

(classroom_models,) = models.Registry.import_models([models.Names.CLASSROOM])


class ClassroomFeedbackRecipientEmailJobTestsBase(job_test_utils.JobTestBase):
    """Base class for Classroom feedback recipient email job tests."""

    def save_legacy_classroom_model_without_feedback_recipient_email(
        self,
    ) -> None:
        """Saves a ClassroomModel stored without feedback_recipient_email."""
        classroom_model = classroom_models.ClassroomModel
        legacy_classroom_properties = dict(
            classroom_model._properties  # pylint: disable=protected-access
        )
        del legacy_classroom_properties['feedback_recipient_email']

        with self.swap(
            classroom_model,
            '_properties',
            legacy_classroom_properties,
        ):
            model = self.create_model(
                classroom_model,
                id='classroom_id',
                name='math',
                url_fragment='math',
                course_details='Course details',
                teaser_text='Teaser text',
                topic_list_intro='Topic list intro',
                topic_id_to_prerequisite_topic_ids={},
                is_published=False,
                diagnostic_test_is_enabled=False,
                thumbnail_filename='',
                thumbnail_bg_color='',
                thumbnail_size_in_bytes=0,
                banner_filename='',
                banner_bg_color='',
                banner_size_in_bytes=0,
                index=0,
            )
            self.put_multi([model])


class MigrateClassroomFeedbackRecipientEmailJobTests(
    ClassroomFeedbackRecipientEmailJobTestsBase
):
    """Tests for MigrateClassroomFeedbackRecipientEmailJob."""

    JOB_CLASS: Type[
        classroom_migration_jobs.MigrateClassroomFeedbackRecipientEmailJob
    ] = classroom_migration_jobs.MigrateClassroomFeedbackRecipientEmailJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrates_classrooms_missing_feedback_recipient_email(self) -> None:
        self.save_legacy_classroom_model_without_feedback_recipient_email()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Migrated ClassroomModel: id=classroom_id'
                ),
                job_run_result.JobRunResult(
                    stdout='migrated_classroom_feedback_recipient_email_count: 1'
                ),
            ]
        )

        fetched_model = classroom_models.ClassroomModel.get_by_id(
            'classroom_id'
        )
        self.assertIsNotNone(fetched_model)
        self.assertEqual(
            fetched_model.feedback_recipient_email,
            feconf.DEFAULT_CLASSROOM_FEEDBACK_RECIPIENT_EMAIL,
        )

    def test_skips_classrooms_with_feedback_recipient_email(self) -> None:
        model = self.create_model(
            classroom_models.ClassroomModel,
            id='classroom_id',
            name='math',
            url_fragment='math',
            feedback_recipient_email='user@email.com',
            course_details='Course details',
            teaser_text='Teaser text',
            topic_list_intro='Topic list intro',
            topic_id_to_prerequisite_topic_ids={},
            is_published=False,
            diagnostic_test_is_enabled=False,
            thumbnail_filename='',
            thumbnail_bg_color='',
            thumbnail_size_in_bytes=0,
            banner_filename='',
            banner_bg_color='',
            banner_size_in_bytes=0,
            index=0,
        )
        self.put_multi([model])

        self.assert_job_output_is_empty()

        fetched_model = classroom_models.ClassroomModel.get_by_id(
            'classroom_id'
        )
        self.assertIsNotNone(fetched_model)
        self.assertEqual(
            fetched_model.feedback_recipient_email, 'user@email.com'
        )


class AuditClassroomFeedbackRecipientEmailJobTests(
    ClassroomFeedbackRecipientEmailJobTestsBase
):
    """Tests for AuditClassroomFeedbackRecipientEmailJob."""

    JOB_CLASS: Type[
        classroom_migration_jobs.AuditClassroomFeedbackRecipientEmailJob
    ] = classroom_migration_jobs.AuditClassroomFeedbackRecipientEmailJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_audits_classrooms_missing_feedback_recipient_email(self) -> None:
        self.save_legacy_classroom_model_without_feedback_recipient_email()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'ClassroomModel missing feedback_recipient_email: '
                        'id=classroom_id'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        'classrooms_missing_feedback_recipient_email_count: 1'
                    )
                ),
            ]
        )

        fetched_model = classroom_models.ClassroomModel.get_by_id(
            'classroom_id'
        )
        self.assertIsNotNone(fetched_model)
        self.assertIsNone(fetched_model.feedback_recipient_email)

    def test_skips_classrooms_with_feedback_recipient_email(self) -> None:
        model = self.create_model(
            classroom_models.ClassroomModel,
            id='classroom_id',
            name='math',
            url_fragment='math',
            feedback_recipient_email='user@email.com',
            course_details='Course details',
            teaser_text='Teaser text',
            topic_list_intro='Topic list intro',
            topic_id_to_prerequisite_topic_ids={},
            is_published=False,
            diagnostic_test_is_enabled=False,
            thumbnail_filename='',
            thumbnail_bg_color='',
            thumbnail_size_in_bytes=0,
            banner_filename='',
            banner_bg_color='',
            banner_size_in_bytes=0,
            index=0,
        )
        self.put_multi([model])

        self.assert_job_output_is_empty()

        fetched_model = classroom_models.ClassroomModel.get_by_id(
            'classroom_id'
        )
        self.assertEqual(
            fetched_model.feedback_recipient_email, 'user@email.com'
        )
