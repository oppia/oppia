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

"""Unit tests for jobs.transforms.feedback_validation."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import feedback_validation
from core.jobs.types import feedback_validation_errors
from core.platform import models
from core.tests import test_utils

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])


class ValidateEntityTypeTests(job_test_utils.PipelinedTestBase):

    def test_model_with_invalid_entity_type_raises_error(self) -> None:
        model = feedback_models.GeneralFeedbackThreadModel(
            id='123',
            entity_id='123',
            subject='test_subject',
            entity_type='invalid',
            created_on=self.NOW,
            last_updated=self.NOW,
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                feedback_validation.ValidateEntityType())
        )
        self.assert_pcoll_equal(output, [
            feedback_validation_errors.InvalidEntityTypeError(model)
        ])

    def test_model_with_valid_entity_type_raises_no_error(self) -> None:
        model = feedback_models.GeneralFeedbackThreadModel(
            id='123',
            entity_id='123',
            subject='test_subject',
            entity_type='exploration',
            created_on=self.NOW,
            last_updated=self.NOW,
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(
                feedback_validation.ValidateEntityType())
        )
        self.assert_pcoll_equal(output, [])


class RelationshipsOfTests(test_utils.TestBase):

    def test_feedback_analytics_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'FeedbackAnalyticsModel', 'id'), ['ExplorationModel'])
