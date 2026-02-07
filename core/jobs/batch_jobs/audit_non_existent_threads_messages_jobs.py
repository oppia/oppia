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

"""Jobs that audit and remove feedback messages whose thread_id does not exist."""

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


class RemoveNonExistentThreadsMessagesJob(base_jobs.JobBase):
    """Removes feedback messages whose thread_id does not exist.

    When DATASTORE_UPDATES_ALLOWED is False, this job behaves as an audit job
    and only reports invalid models without mutating the datastore.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the job.

        Returns:
            PCollection[JobRunResult]. Results from audit or deletion.
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

        invalid_messages = (
            self.pipeline
            | 'Get GeneralFeedbackMessageModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackMessageModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter invalid feedback messages'
            >> beam.Filter(
                lambda msg, valid_thread_ids: (
                    msg.thread_id not in valid_thread_ids
                ),
                beam.pvalue.AsList(thread_ids),
            )
        )

        invalid_user_threads = (
            self.pipeline
            | 'Get GeneralFeedbackThreadUserModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadUserModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter invalid user threads'
            >> beam.Filter(
                lambda model, valid_thread_ids: (
                    model.thread_id not in valid_thread_ids
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

        invalid_user_thread_logs = invalid_user_threads | 'Log invalid user threads' >> beam.Map(
            lambda model: job_run_result.JobRunResult.as_stdout(
                (
                    'GeneralFeedbackThreadUserModel with non-existent thread: '
                    f'id={model.id}, '
                    f'thread_id={model.thread_id}, '
                    f'user_id={model.user_id}'
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

        invalid_user_thread_count = (
            invalid_user_threads
            | 'Count invalid user threads'
            >> beam.combiners.Count.Globally().with_defaults(0)
            | 'Report invalid user thread count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'invalid_user_thread_models_count: {count}'
                )
            )
        )
        outputs = []
        if self.DATASTORE_UPDATES_ALLOWED:
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

            delete_message_results = (
                invalid_messages
                | 'Extract message keys' >> beam.Map(lambda model: model.key)
                | 'Delete invalid feedback messages' >> ndb_io.DeleteModels()
            )

            delete_user_thread_results = (
                invalid_user_threads
                | 'Extract user thread keys'
                >> beam.Map(lambda model: model.key)
                | 'Delete invalid user threads' >> ndb_io.DeleteModels()
            )

            outputs.extend(
                [
                    deleted_message_logs,
                    deleted_user_thread_logs,
                    deleted_message_count,
                    deleted_user_thread_count,
                    delete_message_results,
                    delete_user_thread_results,
                ]
            )
        else:
            outputs.extend(
                [
                    invalid_message_logs,
                    invalid_user_thread_logs,
                    invalid_message_count,
                    invalid_user_thread_count,
                ]
            )

        return outputs | 'Flatten outputs' >> beam.Flatten()


class AuditNonExistentThreadsMessagesJob(RemoveNonExistentThreadsMessagesJob):
    """Audit job for feedback messages with non-existent threads."""

    DATASTORE_UPDATES_ALLOWED = False
