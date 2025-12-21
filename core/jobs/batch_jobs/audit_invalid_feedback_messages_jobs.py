# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Audit job that finds invalid feedback messages.

A feedback message is considered invalid if its author_id is missing
(None or empty string) in GeneralFeedbackMessageModel.
"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])


class AuditInvalidFeedbackMessagesJob(base_jobs.JobBase):
    """Audit job that reports feedback messages with missing author_id."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the audit job.

        Returns:
            PCollection[JobRunResult]. One result per invalid feedback message.
        """

        general_feedback_message_models = (
            self.pipeline
            | 'Get GeneralFeedbackMessageModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackMessageModel.get_all(
                    include_deleted=False
                )
            )
        )

        invalid_feedback_messages_pcoll = (
            general_feedback_message_models
            | 'Filter messages with missing author_id'
            >> beam.Filter(lambda model: not model.author_id)
            | 'Report invalid feedback messages'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    f'Invalid FeedbackMessageModel id={model.id}, '
                    f'thread_id={model.thread_id}, message_id={model.message_id}'
                )
            )
        )

        return invalid_feedback_messages_pcoll
