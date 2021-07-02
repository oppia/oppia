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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import job_test_utils
from jobs.transforms import feedback_validation
from jobs.types import feedback_validation_errors

import apache_beam as beam

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


class ValidateEntityTypeTests(job_test_utils.PipelinedTestBase):

    def test_model_with_invalid_entity_type_raises_error(self):
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

    def test_model_with_valid_entity_type_raises_no_error(self):
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
