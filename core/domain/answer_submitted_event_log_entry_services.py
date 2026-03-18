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

"""Services for answer submitted event log entry"""

from __future__ import annotations

from core.domain import answer_submitted_event_log_entry_domain
from core.platform import models
from core import feconf


MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import stats_models

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


def get_answer_submitted_event_log_entry_from_model(
    answer_submitted_event_log_entry: stats_models.AnswerSubmittedEventLogEntryModel,
) -> answer_submitted_event_log_entry_domain.AnswerSubmittedEventLogEntry:
    return answer_submitted_event_log_entry_domain.AnswerSubmittedEventLogEntry(
        exp_id=answer_submitted_event_log_entry.exp_id,
        exp_version=answer_submitted_event_log_entry.exp_version,
        state_name=answer_submitted_event_log_entry.state_name,
        session_id=answer_submitted_event_log_entry.session_id,
        time_spent_in_state_secs=answer_submitted_event_log_entry.time_spent_in_state_secs,
        is_feedback_useful=answer_submitted_event_log_entry.is_feedback_useful,
        event_schema_version=answer_submitted_event_log_entry.event_schema_version,
    )


def create_answer_submitted_event_log_entry(
    exploration_id,
    exploration_version,
    state_name,
    session_id,
    time_spent_in_secs,
    feedback_is_useful,
) -> answer_submitted_event_log_entry_domain.AnswerSubmittedEventLogEntry:

    answer_submitted_event_log_entry = (
        answer_submitted_event_log_entry_domain.AnswerSubmittedEventLogEntry(
            exp_id=exploration_id,
            exp_version=exploration_version,
            state_name=state_name,
            session_id=session_id,
            time_spent_in_state_secs=time_spent_in_secs,
            is_feedback_useful=feedback_is_useful,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION,
        )
    )

    # answer_submitted_event_log_entry.validate()

    stats_models.AnswerSubmittedEventLogEntryModel.create(
        exp_id=answer_submitted_event_log_entry.exp_id,
        exp_version=answer_submitted_event_log_entry.exp_version,
        state_name=answer_submitted_event_log_entry.state_name,
        session_id=answer_submitted_event_log_entry.session_id,
        time_spent_in_state_secs=answer_submitted_event_log_entry.time_spent_in_state_secs,
        is_feedback_useful=answer_submitted_event_log_entry.is_feedback_useful,
    )
