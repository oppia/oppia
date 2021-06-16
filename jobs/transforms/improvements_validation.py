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

"""Beam DoFns and PTransforms to provide validation of improvements models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import job_utils
from jobs.decorators import validation_decorators
from jobs.types import improvements_validation_errors


import apache_beam as beam

(improvements_models,) = models.Registry.import_models(
    [models.NAMES.improvements])


@validation_decorators.AuditsExisting(improvements_models.TaskEntryModel)
class ValidateCompositeEntityId(beam.DoFn):
    """DoFn to validate the composite entity id."""

    def process(self, input_model):
        """Function that checks if the composite entity id is valid

        Args:
            input_model: improvements_models.TaskEntryModel.
                Entity to validate.

        Yields:
            InvalidCompositeEntityError. Error for models with
            invalid composite entity.
        """
        model = job_utils.clone_model(input_model)
        expected_composite_entity_id = (
            improvements_models.TaskEntryModel.generate_composite_entity_id(
                model.entity_type, model.entity_id, model.entity_version))

        if model.composite_entity_id != expected_composite_entity_id:
            yield improvements_validation_errors.InvalidCompositeEntityError(
                model)
