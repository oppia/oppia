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

"""Audit and migration job for legacy feedback models."""

from __future__ import annotations

import re

from core import feconf, utils
from core.domain import general_feedback_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List, Optional, Tuple, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models, general_feedback_models

(feedback_models, general_feedback_models) = models.Registry.import_models(
    [models.Names.FEEDBACK, models.Names.GENERAL_FEEDBACK]
)

datastore_services = models.Registry.import_datastore_services()

GroupedMigrationValue = Union[
    feedback_models.GeneralFeedbackThreadModel,
    general_feedback_models.LessonFeedbackModel,
]

LEGACY_FEEDBACK_SUBJECT_RE = re.compile(
    r'^Feedback when the user was at card "(.+)"$'
)


class MigrateLegacyFeedbackJob(base_jobs.JobBase):
    """Migration job for legacy feedback models."""

    DATASTORE_UPDATES_ALLOWED = True

    def _is_exploration_thread(
        self,
        thread: feedback_models.GeneralFeedbackThreadModel,
    ) -> bool:
        """Returns whether the legacy thread belongs to an exploration."""
        return bool(thread.entity_type == feconf.ENTITY_TYPE_EXPLORATION)

    def _get_migrated_feedback_id(
        self,
        thread_id: str,
    ) -> str:
        """Returns the deterministic LessonFeedbackModel ID for a legacy thread.

        Args:
            thread_id: str. Legacy GeneralFeedbackThreadModel ID.

        Returns:
            str. Target LessonFeedbackModel ID for this legacy thread.
        """
        return '%s.%s' % (
            general_feedback_models.LessonFeedbackModel.ID_PREFIX,
            utils.convert_to_hash(thread_id, 32),
        )

    def _get_migrated_status(self, legacy_status: str) -> str:
        """Returns the LessonfeedbackModel status for a legacy status.
        LessonFeedbackModel don't have STATUS_CHOICES_IGNORED, thatswhy we are
        returning STATUS_CHOICES_NOT_ACTIONABLE in its place.

        Args:
            legacy_status: str. Legacy GeneralFeedbackThreadModel status.

        Returns:
            str. Status supported by LessonFeedbackModel.
        """
        if legacy_status == feedback_models.STATUS_CHOICES_IGNORED:
            return feconf.STATUS_CHOICES_NOT_ACTIONABLE
        return legacy_status

    def _extract_state_name_from_subject(self, subject: str) -> str:
        """Extracts the state name from the subject of a legacy feedback subject format.

        Args:
            subject: str. Legacy GeneralFeedbackThreadModel subject.

        Returns:
            str. State name when the known format matches, otherwise empty.
        """
        match = LEGACY_FEEDBACK_SUBJECT_RE.match(subject)
        return match.group(1) if match else ''

    def _build_lesson_metadata(
        self,
        thread: feedback_models.GeneralFeedbackThreadModel,
    ) -> general_feedback_domain.LessonMetadataDict:
        """Builds best-effort lesson metadata from legacy feedback data.

        Legacy feedback does not store the historical exploration version, state
        index, or learner answer. Version and state index use the same neutral
        defaults that the new domain conversion layer uses for missing metadata.

        Args:
            thread: GeneralFeedbackThreadModel. The legacy feedback thread.

        Returns:
            dict. Lesson metadata for LessonFeedbackModel.
        """
        assert isinstance(thread.entity_id, str)
        return {
            'exploration_id': thread.entity_id,
            'exploration_version': 0,
            'state_name': self._extract_state_name_from_subject(thread.subject),
            'state_index': 0,
            'learner_current_answer': None,
        }

    def _get_feedback_text_and_responses(
        self,
        messages: List[feedback_models.GeneralFeedbackMessageModel],
    ) -> Tuple[str, List[Dict[str, Union[str, float, None]]]]:
        """Extracts the original feedback text and creator responses.

        Args:
            messages: list(GeneralFeedbackMessageModel). Legacy feedback
                messages in chronological order.

        Returns:
            tuple. The original feedback text and creator responses.
        """
        feedback_text = messages[0].text or ''
        responses = []
        for message in messages[1:]:
            if not message.text:
                continue
            responses.append(
                {
                    'response_text': message.text,
                    'responded_by': message.author_id,
                    'responded_on': utils.get_time_in_millisecs(
                        message.created_on
                    ),
                }
            )
        return feedback_text, responses

    def _create_lesson_feedback_model(
        self,
        thread: feedback_models.GeneralFeedbackThreadModel,
        messages: List[feedback_models.GeneralFeedbackMessageModel],
    ) -> general_feedback_models.LessonFeedbackModel:
        """Creates a new LessonFeedbackModel from a legacy feedback thread.

        Args:
            thread: GeneralFeedbackThreadModel. The legacy feedback thread.
            messages: list(GeneralFeedbackMessageModel). Legacy feedback
                messages in chronological order.

        Returns:
            LessonFeedbackModel. The new feedback model.
        """
        feedback_text, responses = self._get_feedback_text_and_responses(
            messages
        )
        lesson_metadata = self._build_lesson_metadata(thread)
        with datastore_services.get_ndb_context():
            feedback_model = general_feedback_models.LessonFeedbackModel(
                id=self._get_migrated_feedback_id(thread.id),
                author_id=thread.original_author_id,
                feedback_text=feedback_text,
                status=self._get_migrated_status(thread.status),
                exploration_id=thread.entity_id,
                lesson_metadata_schema_version=(
                    feconf.CURRENT_LESSON_METADATA_SCHEMA_VERSION
                ),
                lesson_metadata=lesson_metadata,
                parent_feedback_id=None,
                response_list_schema_version=(
                    feconf.CURRENT_RESPONSE_LIST_SCHEMA_VERSION
                ),
                response_list=responses,
                unread_response_count=0,
            )
            feedback_model.update_timestamps()
            feedback_model.created_on = thread.created_on
            feedback_model.last_updated = thread.last_updated
        return feedback_model

    def _create_migration_result(
        self,
        thread_and_migration_status: Tuple[
            feedback_models.GeneralFeedbackThreadModel,
            List[feedback_models.GeneralFeedbackMessageModel],
            bool,
        ],
    ) -> Optional[general_feedback_models.LessonFeedbackModel]:
        """Returns a migrated model for the legacy thread, or None if skipped.

        Args:
            thread_and_migration_status: tuple. The legacy feedback thread, messages and
                whether its deterministic target model ID already exists.

        Returns:
            LessonFeedbackModel|None. Migrated model when migration is valid and
            needed, otherwise None.
        """
        thread, messages, has_been_migrated = thread_and_migration_status
        if not self._is_exploration_thread(thread):
            return None
        if has_been_migrated:
            return None
        return self._create_lesson_feedback_model(thread, messages)

    def _get_thread_skip_reason(
        self,
        thread: feedback_models.GeneralFeedbackThreadModel,
        has_been_migrated: bool,
    ) -> Optional[str]:
        """Returns the skip reason for a thread, or None if it can migrate."""
        if not self._is_exploration_thread(thread):
            return 'Not an exploration thread'
        if has_been_migrated:
            return 'Already migrated'
        return None

    def _create_migration_log(
        self,
        feedback_model: general_feedback_models.LessonFeedbackModel,
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult for a migrated model."""
        verb = 'Migrated' if self.DATASTORE_UPDATES_ALLOWED else 'Would migrate'
        return job_run_result.JobRunResult.as_stdout(
            '%s legacy feedback thread into lesson feedback: feedback_id=%s'
            % (verb, feedback_model.id)
        )

    def _create_skip_log(
        self,
        thread_and_migration_status: Tuple[
            feedback_models.GeneralFeedbackThreadModel,
            List[feedback_models.GeneralFeedbackMessageModel],
            bool,
        ],
    ) -> Optional[job_run_result.JobRunResult]:
        """Creates a JobRunResult for a skipped legacy thread."""
        thread, unused_messages, has_been_migrated = thread_and_migration_status
        skip_reason = self._get_thread_skip_reason(thread, has_been_migrated)
        if skip_reason is None:
            return None
        return job_run_result.JobRunResult.as_stdout(
            'Skipped legacy feedback thread: legacy_thread_id=%s, reason=%s'
            % (thread.id, skip_reason)
        )

    def _extract_thread_with_migration_status(
        self,
        grouped_item: Tuple[str, Dict[str, List[GroupedMigrationValue]]],
    ) -> List[
        Tuple[
            feedback_models.GeneralFeedbackThreadModel,
            List[feedback_models.GeneralFeedbackMessageModel],
            bool,
        ]
    ]:
        """Extracts legacy threads with whether the target model already exists.

        Args:
            grouped_item: tuple. The deterministic feedback ID and grouped
                legacy thread / existing feedback values.

        Returns:
            list(tuple(GeneralFeedbackThreadModel, list(GeneralFeedbackMessageModel), bool)). Each legacy thread
            paired with whether its target LessonFeedbackModel already exists.
        """
        unused_feedback_id, grouped_values = grouped_item
        existing_feedback_models = grouped_values['existing_feedback']
        has_been_migrated = len(existing_feedback_models) > 0
        # Here we use cast because CoGroupByKey stores all grouped PCollection
        # values under the same dictionary value type, but the legacy_threads
        # tag only contains GeneralFeedbackThreadModel instances.
        legacy_threads_with_messages = cast(
            List[
                Tuple[
                    feedback_models.GeneralFeedbackThreadModel,
                    List[feedback_models.GeneralFeedbackMessageModel],
                ]
            ],
            grouped_values['legacy_threads'],
        )
        return [
            (thread, messages, has_been_migrated)
            for thread, messages in legacy_threads_with_messages
        ]

    def _extract_thread_with_messages(
        self,
        grouped_item: Tuple[
            str,
            Dict[str, List[GroupedMigrationValue]],
        ],
    ) -> Tuple[
        str,
        Tuple[
            feedback_models.GeneralFeedbackThreadModel,
            List[feedback_models.GeneralFeedbackMessageModel],
        ],
    ]:
        """Extracts legacy threads with their messages.

        Args:
            grouped_item: tuple. The deterministic feedback ID and grouped
                legacy thread / messages values.

        Returns:
            tuple. The deterministic feedback ID and the legacy thread and
            messages.
        """
        unused_thread_id, grouped_values = grouped_item
        # Here we use cast because CoGroupByKey stores all grouped PCollection
        # values under the same dictionary value type, but the 'threads' tag
        # only contains GeneralFeedbackThreadModel instances.
        threads = cast(
            List[feedback_models.GeneralFeedbackThreadModel],
            grouped_values['threads'],
        )
        # Here we use cast because CoGroupByKey stores all grouped PCollection
        # values under the same dictionary value type, but the 'messages' tag
        # only contains GeneralFeedbackMessageModel instances.
        messages = cast(
            List[feedback_models.GeneralFeedbackMessageModel],
            grouped_values['messages'],
        )
        thread = threads[0]
        messages = sorted(
            messages,
            key=lambda message: int(message.message_id),
        )
        return (
            self._get_migrated_feedback_id(thread.id),
            (thread, messages),
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the migration.

        Returns:
            PCollection. A PCollection of results from the migration.
        """
        legacy_threads = (
            self.pipeline
            | 'Get GeneralFeedbackThreadmodels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadModel.get_all(
                    include_deleted=False
                )
            )
        )

        legacy_messages = (
            self.pipeline
            | 'Get GeneralFeedbackMessageModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackMessageModel.get_all(
                    include_deleted=False
                )
            )
        )

        legacy_messages_by_thread = (
            legacy_messages
            | 'Key legacy messages by thread ID'
            >> beam.Map(lambda message: (message.thread_id, message))
        )

        legacy_threads_by_thread_id = (
            legacy_threads
            | 'Key legacy threads by thread ID'
            >> beam.Map(lambda thread: (thread.id, thread))
        )

        threads_with_messages = {
            'threads': legacy_threads_by_thread_id,
            'messages': legacy_messages_by_thread,
        } | 'Group legacy threads with messages' >> beam.CoGroupByKey()

        existing_feedback_id_pairs = (
            self.pipeline
            | 'Get LessonFeedbackModels'
            >> ndb_io.GetModels(
                general_feedback_models.LessonFeedbackModel.get_all(
                    include_deleted=False
                )
            )
            | 'Key existing LessonfeedbackModels by ID'
            >> beam.Map(lambda model: (model.id, None))
        )

        legacy_thread_id_pairs = (
            threads_with_messages
            | 'Key legacy threads with messages by feedback ID'
            >> beam.Map(self._extract_thread_with_messages)
        )

        threads_with_migration_status = (
            {
                'legacy_threads': legacy_thread_id_pairs,
                'existing_feedback': existing_feedback_id_pairs,
            }
            | 'CoGroup legacy threads with existing lesson feedback'
            >> beam.CoGroupByKey()
            | 'Extract legacy threads and migration status'
            >> beam.FlatMap(self._extract_thread_with_migration_status)
        )

        migrated_feedback_models = (
            threads_with_migration_status
            | 'Build LessonFeedbackModels'
            >> beam.Map(self._create_migration_result)
            | 'Filter skipped LessonFeedbackmodels'
            >> beam.Filter(lambda model: model is not None)
        )

        migration_logs = (
            migrated_feedback_models
            | 'Log migrated legacy feedback threads'
            >> beam.Map(self._create_migration_log)
        )

        migrated_count = (
            migrated_feedback_models
            | 'Count migrated legacy feedback threads'
            >> beam.combiners.Count.Globally().with_defaults(0)
            | 'Log migrated legacy feedback threads count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'migrated_legacy_feedback_thread_count: %s' % count
                )
            )
        )

        skip_logs = (
            threads_with_migration_status
            | 'Build skipped legacy feedback thread logs'
            >> beam.Map(self._create_skip_log)
            | 'Filter skipped legacy feedback thread logs'
            >> beam.Filter(lambda log: log is not None)
        )

        outputs = [migration_logs, migrated_count, skip_logs]

        if self.DATASTORE_UPDATES_ALLOWED:
            put_results = (
                migrated_feedback_models
                | 'Put migrated LessonFeedbackModels into datastore'
                >> ndb_io.PutModels()
            )
            outputs.append(put_results)

        return (
            outputs
            | 'Flatten legacy feedback migration results' >> beam.Flatten()
        )


class AuditLegacyFeedbackJob(MigrateLegacyFeedbackJob):
    """Audit job for legacy feedback models."""

    DATASTORE_UPDATES_ALLOWED = False
