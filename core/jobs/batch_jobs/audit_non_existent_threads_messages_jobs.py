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

"""Audit job that finds feedback messages whose thread_id does not exist."""

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


class AuditNonExistentThreadsMessagesJob(base_jobs.JobBase):
    """Audit job that reports feedback messages with non-existent threads."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the audit job.

        Returns:
            PCollection[JobRunResult]. One result per invalid message plus a
            stats entry with the total count.
        """
        thread_ids = (
            self.pipeline
            | 'Get GeneralFeedbackThreadModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadModel.get_all(
                    include_deleted=False
                )
            )
            | 'Extract thread ids' >> beam.Map(lambda model: model.id)
        )

        message_models = (
            self.pipeline
            | 'Get GeneralFeedbackMessageModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackMessageModel.get_all(
                    include_deleted=False
                )
            )
        )

        invalid_messages = (
            message_models
            | 'Filter messages with non-existent threads'
            >> beam.Filter(
                lambda msg, valid_thread_ids: (
                    msg.thread_id not in valid_thread_ids
                ),
                beam.pvalue.AsList(thread_ids),
            )
        )

        invalid_message_logs = (
            invalid_messages
            | 'Log invalid feedback messages'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    (
                        'GeneralFeedbackMessageModel with non-existent thread: '
                        f'id={model.id}, '
                        f'thread_id={model.thread_id}, '
                        f'message_id={model.message_id}'
                    )
                )
            )
        )

        invalid_message_count = (
            invalid_messages
            | 'Count invalid feedback messages'
            >> beam.combiners.Count.Globally().with_defaults(0)
            | 'Report invalid feedback message count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'invalid_feedback_message_models_count: {count}'
                )
            )
        )

        return (
            invalid_message_logs,
            invalid_message_count,
        ) | 'Flatten audit outputs' >> beam.Flatten()


class RemoveNonExistentThreadsMessagesJob(base_jobs.JobBase):
    """Beam job that removes feedback messages with non-existent threads."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the beam job."""
        thread_ids = (
            self.pipeline
            | 'Get GeneralFeedbackThreadModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadModel.get_all(
                    include_deleted=False
                )
            )
            | 'Extract thread ids' >> beam.Map(lambda model: model.id)
        )

        message_models = (
            self.pipeline
            | 'Get GeneralFeedbackMessageModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackMessageModel.get_all(
                    include_deleted=False
                )
            )
        )

        user_thread_models = (
            self.pipeline
            | 'Get GeneralFeedbackThreadUserModel'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadUserModel.get_all(
                    include_deleted=False
                )
            )
        )

        invalid_messages = (
            message_models
            | 'Filter messages with non-existent threads'
            >> beam.Filter(
                lambda msg, valid_thread_ids: (
                    msg.thread_id not in valid_thread_ids
                ),
                beam.pvalue.AsList(thread_ids),
            )
        )

        invalid_user_threads = (
            user_thread_models
            | 'Filter user threads with non-existent threads'
            >> beam.Filter(
                lambda user_threads, valid_thread_ids: (
                    user_threads.thread_id not in valid_thread_ids
                ),
                beam.pvalue.AsList(thread_ids),
            )
        )

        deleted_message_logs = (
            invalid_messages
            | 'Log deleted messages'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    (
                        'Deleted GeneralFeedbackMessageModel: '
                        f'id={model.id}, '
                        f'thread_id={model.thread_id}, '
                        f'message_id={model.message_id}'
                    )
                )
            )
        )

        deleted_user_thread_logs = (
            invalid_user_threads
            | 'Log deleted user threads'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    (
                        'Deleted GeneralFeedbackThreadUserModel: '
                        f'id={model.id}, '
                        f'thread_id={model.thread_id}, '
                        f'user_id={model.user_id} '
                    )
                )
            )
        )

        deleted_message_results = (
            invalid_messages
            | 'Extract message keys' >> beam.Map(lambda model: model.key)
            | 'Delete invalid feedback messages' >> ndb_io.DeleteModels()
        )

        deleted_user_thread_results = (
            invalid_user_threads
            | 'Extract user thread keys' >> beam.Map(lambda model: model.key)
            | 'Delete non-existent user threads' >> ndb_io.DeleteModels()
        )

        deleted_message_count = (
            invalid_messages
            | 'Count deleted messages'
            >> beam.combiners.Count.Globally().with_defaults(0)
            | 'Report deleted message count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'deleted_feedback_message_models_count: {count}'
                )
            )
        )

        deleted_user_thread_count = (
            invalid_user_threads
            | 'Count deleted user threads'
            >> beam.combiners.Count.Globally().with_defaults(0)
            | 'Report deleted user thread count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'deleted_user_thread_models_count: {count}'
                )
            )
        )

        return (
            deleted_message_logs,
            deleted_user_thread_logs,
            deleted_message_count,
            deleted_user_thread_count,
            deleted_message_results,
            deleted_user_thread_results,
        ) | 'Flatten deletion outputs' >> beam.Flatten()
