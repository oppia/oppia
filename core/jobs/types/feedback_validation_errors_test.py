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

"""Unit tests for feedback model validator errors."""

from __future__ import annotations

from core.jobs.types import base_validation_errors_test
from core.jobs.types import feedback_validation_errors
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import feedback_models

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])

datastore_services = models.Registry.import_datastore_services()


class InvalidEntityTypeErrorTests(
        base_validation_errors_test.AuditErrorsTestBase):

    def test_message(self) -> None:
        model = feedback_models.GeneralFeedbackThreadModel(
            id='123',
            entity_id='123',
            subject='test_subject',
            entity_type='invalid',
            created_on=self.NOW,
            last_updated=self.NOW,
        )
        error = feedback_validation_errors.InvalidEntityTypeError(model)

        self.assertEqual(
            error.stderr,
            'InvalidEntityTypeError in GeneralFeedbackThreadModel(id="123"):'
            ' entity type %s is invalid.' % model.entity_type)
