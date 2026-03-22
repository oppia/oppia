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

"""Tests for services for answer submitted event log entry."""

from __future__ import annotations

from core.domain import answer_submitted_event_log_entry_services
from core.platform import models
from core.tests import test_utils

from typing import Any

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


class AnswerSubmittedEventLogEntryServicesTest(test_utils.GenericTestBase):
    """Tests for AnswerSubmittedEventLogEntry services."""

    def setUp(self) -> None:
        super().setUp()
        self.exp_id = 'exp_1'
        self.owner_id = 'owner'

        self.exploration = self.save_new_valid_exploration(
            self.exp_id, self.owner_id
        )

    def test_get_answer_submitted_event_log_entry_from_model(self) -> None:
        model = stats_models.AnswerSubmittedEventLogEntryModel(
            exp_id='exp_1',
            exp_version=1,
            state_name='Introduction',
            session_id='session_1',
            time_spent_in_state_secs=12.0,
            is_feedback_useful=True,
            event_schema_version=1,
        )

        domain_obj = answer_submitted_event_log_entry_services.get_answer_submitted_event_log_entry_from_model(
            model
        )

        self.assertEqual(domain_obj.exp_id, 'exp_1')
        self.assertEqual(domain_obj.exp_version, 1)
        self.assertEqual(domain_obj.state_name, 'Introduction')
        self.assertEqual(domain_obj.session_id, 'session_1')
        self.assertEqual(domain_obj.time_spent_in_state_secs, 12.0)
        self.assertTrue(domain_obj.is_feedback_useful)
        self.assertEqual(domain_obj.event_schema_version, 1)

    def test_create_answer_submitted_event_log_entry(self) -> None:
        with self.swap(
            stats_models.AnswerSubmittedEventLogEntryModel,
            'create',
            lambda *args, **kwargs: None,
        ):
            answer_submitted_event_log_entry_services.create_answer_submitted_event_log_entry(
                exploration_id=self.exp_id,
                exploration_version=self.exploration.version,
                state_name='Introduction',
                session_id='session_1',
                time_spent_in_secs=10.0,
                feedback_is_useful=True,
            )

    def test_create_answer_submitted_event_log_entry_calls_model_create(
        self,
    ) -> None:
        calls = []

        # Here we use type Any because mock_create function
        # accept any type of arguments.
        def mock_create(**kwargs: Any) -> None:
            calls.append(kwargs)

        with self.swap(
            stats_models.AnswerSubmittedEventLogEntryModel,
            'create',
            mock_create,
        ):
            answer_submitted_event_log_entry_services.create_answer_submitted_event_log_entry(
                exploration_id=self.exp_id,
                exploration_version=self.exploration.version,
                state_name='Introduction',
                session_id='session_123',
                time_spent_in_secs=15.0,
                feedback_is_useful=False,
            )

        self.assertEqual(len(calls), 1)
