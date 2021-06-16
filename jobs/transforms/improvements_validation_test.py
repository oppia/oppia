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

"""Unit tests for jobs.transforms.improvements_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules


from core.platform import models

from jobs import job_test_utils
from jobs.transforms import improvements_validation
from jobs.types import improvements_validation_errors

import apache_beam as beam

(improvements_models,) = models.Registry.import_models(
    [models.NAMES.improvements])


class ValidateCompositeEntityIdTests(job_test_utils.PipelinedTestBase):

    def test_model_with_invalid_composite_entity(self):
        model = improvements_models.TaskEntryModel(
            id='123',
            entity_id='999',
            entity_type='exploration',
            entity_version=2,
            target_id='888',
            target_type='state',
            task_type='high_bounce_rate',
            status='open',
            composite_entity_id='invalid_id',
            created_on=self.NOW,
            last_updated=self.NOW,
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(improvements_validation.ValidateCompositeEntityId())
        )
        self.assert_pcoll_equal(output, [
            improvements_validation_errors.InvalidCompositeEntityError(model)
        ])

    def test_model_with_valid_composite_entity(self):
        # Value has the form: "[entity_type].[entity_id].[entity_version]".
        model = improvements_models.TaskEntryModel(
            id='23',
            entity_id='999',
            entity_type='exploration',
            entity_version=2,
            target_id='888',
            target_type='state',
            task_type='high_bounce_rate',
            status='open',
            composite_entity_id='exploration.999.2',
            created_on=self.NOW,
            last_updated=self.NOW,
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(improvements_validation.ValidateCompositeEntityId())
        )
        self.assert_pcoll_equal(output, [])
